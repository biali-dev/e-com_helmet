from decimal import Decimal
from rest_framework import serializers
from .models import Order, OrderItem


class CheckoutItemInputSerializer(serializers.Serializer):
    productId = serializers.IntegerField(min_value=1)
    name = serializers.CharField(max_length=220)
    price = serializers.CharField()  # vem do front
    qty = serializers.IntegerField(min_value=1, max_value=99)


class ShippingInputSerializer(serializers.Serializer):
    zip = serializers.CharField(max_length=9)
    street = serializers.CharField(max_length=255)
    number = serializers.CharField(max_length=30)
    complement = serializers.CharField(max_length=120, required=False, allow_blank=True)
    district = serializers.CharField(max_length=120)
    city = serializers.CharField(max_length=120)
    state = serializers.CharField(max_length=2)

    method = serializers.CharField(max_length=50)
    price = serializers.CharField()  # string "29.90"
    days = serializers.IntegerField(min_value=0, max_value=60)


class CheckoutCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=160)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)

    items = CheckoutItemInputSerializer(many=True)
    shipping = ShippingInputSerializer()

    # totals é opcional: frontend manda, mas backend não confia.
    totals = serializers.DictField(required=False)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Carrinho vazio.")
        return items

    def create(self, validated_data):
        items_data = validated_data["items"]
        shipping_data = validated_data["shipping"]

        subtotal = Decimal("0.00")
        for i in items_data:
            price = Decimal(i["price"])
            qty = int(i["qty"])
            subtotal += price * qty

        shipping_price = Decimal(shipping_data["price"])
        total = subtotal + shipping_price

        order = Order.objects.create(
            full_name=validated_data["full_name"],
            email=validated_data["email"],
            phone=validated_data.get("phone", ""),
            status=Order.Status.AWAITING_PAYMENT,

            subtotal=subtotal,
            shipping_price=shipping_price,
            total=total,

            shipping_method=shipping_data["method"],
            shipping_days=int(shipping_data["days"]),

            shipping_zip=shipping_data["zip"],
            shipping_street=shipping_data["street"],
            shipping_number=shipping_data["number"],
            shipping_complement=shipping_data.get("complement", ""),
            shipping_district=shipping_data["district"],
            shipping_city=shipping_data["city"],
            shipping_state=shipping_data["state"].upper(),
        )

        for i in items_data:
            OrderItem.objects.create(
                order=order,
                product_id=i["productId"],
                name=i["name"],
                price=Decimal(i["price"]),
                qty=int(i["qty"]),
            )

        return order


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("product_id", "name", "price", "qty")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "full_name",
            "email",
            "phone",
            "subtotal",
            "shipping_price",
            "total",
            "shipping_method",
            "shipping_days",
            "shipping_zip",
            "shipping_street",
            "shipping_number",
            "shipping_complement",
            "shipping_district",
            "shipping_city",
            "shipping_state",
            "created_at",
            "items",
        )


# Para o Card Brick (amount)
class OrderPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("id", "subtotal", "shipping_price", "total", "status", "email", "full_name")