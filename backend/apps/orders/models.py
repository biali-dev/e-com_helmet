from django.db import models


class Order(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        AWAITING_PAYMENT = "awaiting_payment", "Awaiting payment"
        PAID = "paid", "Paid"
        CANCELED = "canceled", "Canceled"

    full_name = models.CharField(max_length=160)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)

    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Order #{self.id} ({self.status})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")

    product_id = models.IntegerField()  # MVP: guarda ID do produto (depois vira FK)
    name = models.CharField(max_length=220)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    qty = models.PositiveIntegerField(default=1)

    def line_total(self):
        return self.price * self.qty

    def __str__(self) -> str:
        return f"{self.name} x{self.qty}"
