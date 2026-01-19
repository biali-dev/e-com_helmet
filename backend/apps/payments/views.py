import uuid
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.generics import RetrieveAPIView

from apps.orders.models import Order
from .models import Payment, PaymentEvent
from .serializers import PaymentCreateSerializer, PaymentSerializer
from .services import create_payment_dummy

class PaymentDetailAPIView(RetrieveAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class PaymentCreateAPIView(APIView):
    def post(self, request):
        s = PaymentCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        order = Order.objects.get(id=s.validated_data["order_id"])

        # Idempotência simples: o front pode mandar header depois.
        idempotency_key = request.headers.get("Idempotency-Key") or str(uuid.uuid4())

        payment, created = Payment.objects.get_or_create(
            order=order,
            defaults={
                "method": s.validated_data["method"],
                "amount": order.subtotal,
                "idempotency_key": idempotency_key,
            },
        )

        if not created:
            # Se já existe, só devolve
            return Response(PaymentSerializer(payment).data)

        # MVP: provider dummy
        payment = create_payment_dummy(payment)

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class PaymentWebhookAPIView(APIView):
    """
    No provedor real, aqui você valida assinatura e atualiza status.
    No dummy, vamos aceitar um payload simples.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data or {}
        payment_id = payload.get("payment_id")
        new_status = payload.get("status")  # "paid", "failed", etc.

        if not payment_id or not new_status:
            return Response({"detail": "payment_id e status são obrigatórios"}, status=400)

        try:
            payment = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            return Response({"detail": "payment não encontrado"}, status=404)

        PaymentEvent.objects.create(
            payment=payment,
            event_type=f"webhook_{new_status}",
            raw_payload=payload,
        )

        payment.status = new_status
        payment.save(update_fields=["status", "updated_at"])

        if new_status == Payment.Status.PAID:
            payment.mark_paid()

        return Response({"ok": True})
