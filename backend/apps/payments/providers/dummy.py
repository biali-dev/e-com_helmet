import base64
import uuid
from datetime import timedelta
from django.utils import timezone

from apps.payments.models import Payment
from .base import WebhookEvent


class DummyProvider:
    name = "dummy"

    def create_payment(self, payment: Payment) -> Payment:
        if payment.method == Payment.Method.PIX:
            qr_text = f"PIX-DUMMY-{uuid.uuid4()}"
            payment.pix_qr_code = qr_text
            payment.pix_qr_code_base64 = base64.b64encode(qr_text.encode("utf-8")).decode("utf-8")
            payment.pix_expires_at = timezone.now() + timedelta(minutes=30)
            payment.status = Payment.Status.PENDING
        else:
            payment.status = Payment.Status.PENDING

        payment.provider_payment_id = f"dummy_{uuid.uuid4()}"
        payment.save()
        return payment

    def parse_webhook(self, request) -> WebhookEvent:
        payload = request.data or {}
        payment_id = str(payload.get("payment_id", ""))
        status = str(payload.get("status", ""))

        return WebhookEvent(
            provider=self.name,
            event_type=f"webhook_{status}",
            provider_event_id=str(payload.get("event_id", "")),
            provider_payment_id=payment_id,  # aqui é o Payment.id no dummy
            status=status,
            raw=payload,
        )

    def find_payment(self, event: WebhookEvent):
        # Dummy usa o payment_id interno
        try:
            return Payment.objects.get(id=int(event.provider_payment_id))
        except Exception:
            return None
