# backend/apps/payments/providers/mercado_pago.py
import hashlib
import hmac
import json
from typing import Optional

import requests
from django.conf import settings

from apps.payments.models import Payment
from .base import WebhookEvent

MP_API = "https://api.mercadopago.com"


def _auth_headers(idempotency_key: str) -> dict:
    token = getattr(settings, "MERCADOPAGO_ACCESS_TOKEN", "")
    if not token:
        raise RuntimeError("MERCADOPAGO_ACCESS_TOKEN não configurado.")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotency_key,
    }


def _map_mp_status_to_internal(mp_status: str) -> str:
    mp_status = (mp_status or "").lower()

    if mp_status == "approved":
        return Payment.Status.PAID

    if mp_status in ("in_process", "pending", "authorized"):
        return Payment.Status.PENDING

    if mp_status in ("rejected"):
        return Payment.Status.FAILED

    if mp_status in ("cancelled"):
        return Payment.Status.CANCELED

    return Payment.Status.PENDING


def _extract_signature_parts(x_signature: str) -> tuple[str, str]:
    parts = {}
    for chunk in (x_signature or "").split(","):
        if "=" in chunk:
            k, v = chunk.split("=", 1)
            parts[k.strip()] = v.strip()
    return parts.get("ts", ""), parts.get("v1", "")


def _verify_webhook_signature(*, request, data_id: str) -> bool:
    """
    Validação baseada no padrão do MP: x-signature contém ts e v1, usando x-request-id e secret.
    Em dev, se PAYMENTS_WEBHOOK_SECRET estiver vazio, não bloqueia.
    """
    secret = getattr(settings, "PAYMENTS_WEBHOOK_SECRET", "")
    if not secret:
        return True

    x_signature = request.headers.get("x-signature", "")
    x_request_id = request.headers.get("x-request-id", "")

    ts, v1 = _extract_signature_parts(x_signature)
    if not (ts and v1 and x_request_id and data_id):
        return False

    manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
    digest = hmac.new(secret.encode("utf-8"), manifest.encode("utf-8"), hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, v1)


class MercadoPagoProvider:
    name = "mercado_pago"

    def create_payment(self, payment: Payment, *, payer_email: str, card_data: Optional[dict] = None) -> Payment:
        """
        Cria pagamento Pix ou Cartao via /v1/payments.
        - Pix: payment_method_id = "pix"
        - Cartao: exige token + payment_method_id + installments (vindos do frontend via Bricks)
        """
        if payment.method == Payment.Method.PIX:
            payload = {
                "transaction_amount": float(payment.amount),
                "description": f"Order #{payment.order_id}",
                "payment_method_id": "pix",
                "payer": {"email": payer_email},
            }

            r = requests.post(
                f"{MP_API}/v1/payments",
                headers=_auth_headers(payment.idempotency_key),
                data=json.dumps(payload),
                timeout=25,
            )
            if r.status_code >= 400:
                raise RuntimeError(f"MP {r.status_code}: {r.text}")

            data = r.json()

            payment.provider = self.name
            payment.provider_payment_id = str(data.get("id", ""))
            payment.status = _map_mp_status_to_internal(str(data.get("status", "")))

            poi = data.get("point_of_interaction") or {}
            tx = poi.get("transaction_data") or {}
            payment.pix_qr_code = tx.get("qr_code") or ""
            payment.pix_qr_code_base64 = tx.get("qr_code_base64") or ""

            payment.save()
            return payment

        if payment.method == Payment.Method.CARD:
            if not card_data:
                raise RuntimeError("card_data obrigatório para cartão (token, payment_method_id, installments).")

            payload = {
                "transaction_amount": float(payment.amount),
                "token": card_data["token"],
                "description": f"Order #{payment.order_id}",
                "installments": int(card_data["installments"]),
                "payment_method_id": card_data["payment_method_id"],
                "payer": {"email": payer_email},
            }

            issuer_id = (card_data.get("issuer_id") or "").strip()
            if issuer_id:
                payload["issuer_id"] = issuer_id

            r = requests.post(
                f"{MP_API}/v1/payments",
                headers=_auth_headers(payment.idempotency_key),
                data=json.dumps(payload),
                timeout=25,
            )
            if r.status_code >= 400:
                raise RuntimeError(f"MP {r.status_code}: {r.text}")

            data = r.json()

            payment.provider = self.name
            payment.provider_payment_id = str(data.get("id", ""))
            payment.status = _map_mp_status_to_internal(str(data.get("status", "")))

            payment.save()
            return payment

        raise RuntimeError(f"Método não suportado: {payment.method}")

    def parse_webhook(self, request) -> WebhookEvent:
        payload = request.data or {}
        data = payload.get("data") or {}
        data_id = str(data.get("id", ""))

        if not data_id:
            raise ValueError("Webhook sem data.id")

        if not _verify_webhook_signature(request=request, data_id=data_id):
            raise ValueError("Webhook signature inválida")

        # Notificação aponta para um payment id (data.id). Status real vem do refresh_status_from_api.
        return WebhookEvent(
            provider=self.name,
            event_type=str(payload.get("action") or payload.get("type") or "webhook"),
            provider_event_id=str(payload.get("id", "")),
            provider_payment_id=data_id,
            status=Payment.Status.PENDING,
            raw=payload,
        )

    def find_payment(self, event: WebhookEvent) -> Optional[Payment]:
        return Payment.objects.filter(provider=self.name, provider_payment_id=event.provider_payment_id).first()

    def refresh_status_from_api(self, payment: Payment) -> Payment:
        if not payment.provider_payment_id:
            return payment

        token = getattr(settings, "MERCADOPAGO_ACCESS_TOKEN", "")
        if not token:
            raise RuntimeError("MERCADOPAGO_ACCESS_TOKEN não configurado.")

        r = requests.get(
            f"{MP_API}/v1/payments/{payment.provider_payment_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=25,
        )
        if r.status_code >= 400:
            raise RuntimeError(f"MP {r.status_code}: {r.text}")

        data = r.json()
        payment.status = _map_mp_status_to_internal(str(data.get("status", "")))

        poi = data.get("point_of_interaction") or {}
        tx = poi.get("transaction_data") or {}
        qr = tx.get("qr_code") or ""
        qr64 = tx.get("qr_code_base64") or ""
        if qr:
            payment.pix_qr_code = qr
        if qr64:
            payment.pix_qr_code_base64 = qr64

        payment.save(update_fields=["status", "pix_qr_code", "pix_qr_code_base64", "updated_at"])
        return payment
