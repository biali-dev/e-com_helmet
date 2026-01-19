from decimal import Decimal
from rest_framework import serializers
from .models import Order, OrderItem


class CheckoutItemInputSerializer(serializers.Serializer):
    productId = serializers.IntegerField(min_value=1)
    name = serializers.CharField(max_length=220)
    price = serializers.CharField()  # vem como string do front
    qty = serializers.IntegerField(min_value=1, max_value=99)


class CheckoutCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=160)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    items = CheckoutItemInputSerializer(many=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Carrinho vazio.")
        return items

    def create(self, validated_data):
        items_data = validated_data.pop("items")

        order = Order.objects.create(
            full_name=validated_data["full_name"],
            email=validated_data["email"],
            phone=validated_data.get("phone", ""),
            status=Order.Status.AWAITING_PAYMENT,
        )

        subtotal = Decimal("0.00")

        for i in items_data:
            price = Decimal(i["price"])
            qty = int(i["qty"])
            subtotal += price * qty

            OrderItem.objects.create(
                order=order,
                product_id=i["productId"],
                name=i["name"],
                price=price,
                qty=qty,
            )

        order.subtotal = subtotal
        order.save(update_fields=["subtotal"])

        return order


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("product_id", "name", "price", "qty")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ("id", "status", "full_name", "email", "phone", "subtotal", "created_at", "items")
