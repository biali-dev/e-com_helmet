# backend/apps/payments/serializers.py
from rest_framework import serializers
from apps.orders.models import Order
from .models import Payment

class CardDataSerializer(serializers.Serializer):
    token = serializers.CharField()
    payment_method_id = serializers.CharField()
    installments = serializers.IntegerField(min_value=1, max_value=36)
    issuer_id = serializers.CharField(required=False, allow_blank=True)

class PaymentCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(min_value=1)
    method = serializers.ChoiceField(choices=Payment.Method.choices)
    provider = serializers.ChoiceField(
        choices=[("dummy", "dummy"), ("mercado_pago", "mercado_pago")],
        required=False,
        default="dummy",
    )
    card = CardDataSerializer(required=False)

    def validate_order_id(self, order_id: int) -> int:
        if not Order.objects.filter(id=order_id).exists():
            raise serializers.ValidationError("Pedido não encontrado.")
        return order_id

    def validate(self, attrs):
        method = attrs.get("method")
        card = attrs.get("card")

        if method == Payment.Method.CARD and not card:
            raise serializers.ValidationError({"card": "Obrigatório para pagamentos com cartão."})

        return attrs

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "id",
            "order",
            "provider",
            "method",
            "status",
            "amount",
            "pix_qr_code",
            "pix_qr_code_base64",
            "pix_expires_at",
            "created_at",
        )
