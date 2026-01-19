from django.db import models
from django.utils import timezone

from apps.orders.models import Order


class Payment(models.Model):
    class Provider(models.TextChoices):
        DUMMY = "dummy", "Dummy"  # MVP para testar fluxo
        # MERCADO_PAGO = "mercado_pago", "Mercado Pago"
        # PAGARME = "pagarme", "Pagar.me"
        # ASAAS = "asaas", "Asaas"

    class Method(models.TextChoices):
        PIX = "pix", "Pix"
        CARD = "card", "Card"

    class Status(models.TextChoices):
        CREATED = "created", "Created"
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        CANCELED = "canceled", "Canceled"
        REFUNDED = "refunded", "Refunded"

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")
    provider = models.CharField(max_length=30, choices=Provider.choices, default=Provider.DUMMY)
    method = models.CharField(max_length=10, choices=Method.choices)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="BRL")

    # IDs/refs do provedor
    provider_payment_id = models.CharField(max_length=120, blank=True, default="")
    idempotency_key = models.CharField(max_length=80, unique=True)

    # Dados úteis (Pix QR, link, etc.)
    pix_qr_code = models.TextField(blank=True, default="")
    pix_qr_code_base64 = models.TextField(blank=True, default="")
    pix_expires_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def mark_paid(self):
        self.status = self.Status.PAID
        self.save(update_fields=["status", "updated_at"])
        self.order.status = Order.Status.PAID
        self.order.save(update_fields=["status"])

    def __str__(self) -> str:
        return f"Payment order={self.order_id} {self.method} {self.status}"


class PaymentEvent(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="events")
    event_type = models.CharField(max_length=80)
    provider_event_id = models.CharField(max_length=120, blank=True, default="")
    raw_payload = models.JSONField(default=dict)
    received_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"{self.event_type} payment={self.payment_id}"
