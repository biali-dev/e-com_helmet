import base64
import uuid
from datetime import timedelta
from django.utils import timezone

from .models import Payment


def create_payment_dummy(payment: Payment) -> Payment:
    """
    Simula Pix: gera QR fake (texto) e base64 fake.
    Cartão: fica pending e depois você marca como paid via endpoint de teste.
    """
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
