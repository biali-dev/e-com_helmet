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
    # Mercado Pago costuma usar approved/authorized/in_process/rejected/cancelled etc.
    mp_status = (mp_status or "").lower()

    if mp_status in ("approved",):
        return Payment.Status.PAID
    if mp_status in ("in_process", "pending", "authorized"):
        return Payment.Status.PENDING
    if mp_status in ("rejected",):
        return Payment.Status.FAILED
    if mp_status in ("cancelled",):
        return Payment.Status.CANCELED
    return Payment.Status.PENDING


def _extract_signature_parts(x_signature: str) -> tuple[str, str]:
    # x-signature: "ts=...,v1=..."
    parts = {}
    for chunk in (x_signature or "").split(","):
        if "=" in chunk:
            k, v = chunk.split("=", 1)
            parts[k.strip()] = v.strip()
    return parts.get("ts", ""), parts.get("v1", "")


def _verify_webhook_signature(*, request, data_id: str) -> bool:
    """
    Mercado Pago descreve assinatura no header x-signature com ts e v1 e uso do x-request-id. :contentReference[oaicite:3]{index=3}
    A construção do 'manifest' é comumente feita com: id, request-id e ts (ex.: "id:{id};request-id:{rid};ts:{ts};")
    """
    secret = getattr(settings, "PAYMENTS_WEBHOOK_SECRET", "")
    if not secret:
        # Se você ainda não configurou o secret, não bloqueie em dev
        return True

    x_signature = request.headers.get("x-signature", "")
    x_request_id = request.headers.get("x-request-id", "")

    ts, v1 = _extract_signature_parts(x_signature)
    if not (ts and v1 and x_request_id and data_id):
        return False

    manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
    digest = hmac.new(secret.encode("utf-8"), manifest.encode("utf-8"), hashlib.sha256).hexdigest()

    # compare seguro
    return hmac.compare_digest(digest, v1)


class MercadoPagoProvider:
    name = "mercado_pago"

    def create_payment(self, payment: Payment, *, payer_email: str) -> Payment:
        """
        Pix: cria pagamento via /v1/payments. A documentação do MP indica Pix por esse endpoint. :contentReference[oaicite:4]{index=4}
        """
        if payment.method == Payment.Method.CARD:
            # Cartão real exige tokenização no frontend (Bricks) e envio do token para o backend.
            # Vamos manter pronto para o futuro sem quebrar o app.
            raise NotImplementedError("Cartão Mercado Pago: implementar após tokenização (Bricks).")

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
        r.raise_for_status()
        data = r.json()

        payment.provider = self.name
        payment.provider_payment_id = str(data.get("id", ""))

        mp_status = str(data.get("status", ""))
        payment.status = _map_mp_status_to_internal(mp_status)

        # Pix QR costuma vir em point_of_interaction.transaction_data (qr_code / qr_code_base64). :contentReference[oaicite:5]{index=5}
        poi = data.get("point_of_interaction") or {}
        tx = poi.get("transaction_data") or {}
        payment.pix_qr_code = tx.get("qr_code") or ""
        payment.pix_qr_code_base64 = tx.get("qr_code_base64") or ""

        payment.save()
        return payment

    def parse_webhook(self, request) -> WebhookEvent:
        payload = request.data or {}
        data = payload.get("data") or {}
        data_id = str(data.get("id", ""))

        if not _verify_webhook_signature(request=request, data_id=data_id):
            # assinatura inválida
            raise ValueError("Webhook signature inválida")

        # Em geral, notificação aponta para um ID, e você consulta /v1/payments/{id} para status final. :contentReference[oaicite:6]{index=6}
        return WebhookEvent(
            provider=self.name,
            event_type=str(payload.get("action") or payload.get("type") or "webhook"),
            provider_event_id=str(payload.get("id", "")),
            provider_payment_id=data_id,
            status=Payment.Status.PENDING,  # status real vem do GET /v1/payments/{id}
            raw=payload,
        )

    def find_payment(self, event: WebhookEvent) -> Optional[Payment]:
        # Primeiro tenta por provider_payment_id
        p = Payment.objects.filter(provider=self.name, provider_payment_id=event.provider_payment_id).first()
        if p:
            return p

        # fallback (raro): nada encontrado
        return None

    def refresh_status_from_api(self, payment: Payment) -> Payment:
        """
        Consulta o pagamento no MP para pegar status final.
        GET /v1/payments/{id}. :contentReference[oaicite:7]{index=7}
        """
        if not payment.provider_payment_id:
            return payment

        r = requests.get(
            f"{MP_API}/v1/payments/{payment.provider_payment_id}",
            headers={"Authorization": f"Bearer {settings.MERCADOPAGO_ACCESS_TOKEN}"},
            timeout=25,
        )
        r.raise_for_status()
        data = r.json()

        mp_status = str(data.get("status", ""))
        payment.status = _map_mp_status_to_internal(mp_status)

        poi = data.get("point_of_interaction") or {}
        tx = poi.get("transaction_data") or {}
        # atualiza QR se vier
        payment.pix_qr_code = tx.get("qr_code") or payment.pix_qr_code
        payment.pix_qr_code_base64 = tx.get("qr_code_base64") or payment.pix_qr_code_base64

        payment.save(update_fields=["status", "pix_qr_code", "pix_qr_code_base64", "updated_at"])
        return payment
