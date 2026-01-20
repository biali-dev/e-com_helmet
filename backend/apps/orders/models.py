from decimal import Decimal
from django.db import models


class Order(models.Model):
    # =========================
    # STATUS DO PEDIDO
    # =========================
    class Status(models.TextChoices):
        AWAITING_PAYMENT = "awaiting_payment", "Aguardando pagamento"
        PAID = "paid", "Pago"
        PACKING = "packing", "Em separação"
        SHIPPED = "shipped", "Enviado"
        DELIVERED = "delivered", "Entregue"
        CANCELED = "canceled", "Cancelado"

    # =========================
    # DADOS DO CLIENTE
    # =========================
    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)

    # =========================
    # VALORES
    # =========================
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    shipping_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    # =========================
    # FRETE / ENDEREÇO (MVP)
    # =========================
    shipping_name = models.CharField(max_length=120, default="", blank=True)
    shipping_zip = models.CharField(max_length=9, default="", blank=True)

    shipping_street = models.CharField(max_length=255, default="", blank=True)
    shipping_number = models.CharField(max_length=30, default="", blank=True)
    shipping_complement = models.CharField(max_length=120, blank=True, default="")

    shipping_district = models.CharField(max_length=120, default="", blank=True)
    shipping_city = models.CharField(max_length=120, default="", blank=True)
    shipping_state = models.CharField(max_length=2, default="", blank=True)

    shipping_method = models.CharField(max_length=50, default="", blank=True)
    shipping_days = models.PositiveSmallIntegerField(default=0)

    # =========================
    # CONTROLE
    # =========================
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.AWAITING_PAYMENT)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_totals(self):
        """
        Recalcula subtotal e total a partir dos itens.
        Use isso sempre que criar/alterar itens.
        """
        subtotal = Decimal("0.00")
        for item in self.items.all():
            subtotal += item.price * item.qty

        self.subtotal = subtotal
        self.total = (self.subtotal or Decimal("0.00")) + (self.shipping_price or Decimal("0.00"))

    def mark_paid(self):
        self.status = self.Status.PAID
        self.save(update_fields=["status", "updated_at"])

    def __str__(self):
        return f"Pedido #{self.id} - {self.full_name} - {self.status}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")

    # MVP: manter product_id como Integer (você pode trocar para FK depois)
    product_id = models.IntegerField()

    name = models.CharField(max_length=220)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    qty = models.PositiveIntegerField(default=1)

    def line_total(self) -> Decimal:
        return self.price * self.qty

    def __str__(self):
        return f"{self.name} x{self.qty}"