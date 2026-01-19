from rest_framework import serializers
from apps.orders.models import Order
from .models import Payment


class PaymentCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(min_value=1)
    method = serializers.ChoiceField(choices=Payment.Method.choices)

    def validate_order_id(self, order_id):
        if not Order.objects.filter(id=order_id).exists():
            raise serializers.ValidationError("Pedido não encontrado.")
        return order_id


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
