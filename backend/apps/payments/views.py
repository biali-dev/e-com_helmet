# backend/apps/payments/views.py

import uuid
from typing import Any

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView

from apps.orders.models import Order
from .models import Payment, PaymentEvent
from .serializers import PaymentCreateSerializer, PaymentSerializer
from .providers.registry import get_provider

class PaymentCreateAPIView(APIView):
    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data["order_id"]
        method = serializer.validated_data["method"]
        provider_name = serializer.validated_data.get("provider") or request.data.get("provider") or "dummy"
        card_data = serializer.validated_data.get("card")

        order = Order.objects.get(id=order_id)
        provider = get_provider(provider_name)

        idempotency_key = request.headers.get("Idempotency-Key") or str(uuid.uuid4())

        payment, created = Payment.objects.get_or_create(
            order=order,
            defaults={
                "provider": provider.name,
                "method": method,
                "amount": order.subtotal,
                "idempotency_key": idempotency_key,
                "status": Payment.Status.CREATED,
            },
        )

        if not created:
            return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)

        try:
            payment = provider.create_payment(payment, payer_email=order.email, card_data=card_data)
        except Exception as e:
            # deixa em 400 com mensagem legível
            raise ValidationError({"detail": str(e)})

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

class PaymentWebhookAPIView(APIView):
    """
    Webhook por provider:
      POST /api/v1/payments/webhook/<provider>/

    Exemplos:
      - dummy: /api/v1/payments/webhook/dummy/
      - mercado_pago: /api/v1/payments/webhook/mercado_pago/

    Cada provider:
      - valida assinatura (se aplicável)
      - parseia evento
      - encontra Payment correspondente
      - opcionalmente faz refresh de status via API do provider
    """

    permission_classes = [AllowAny]

    def post(self, request, provider: str):
        prov = get_provider(provider)

        # 1) Parse + valida assinatura (quando aplicável)
        try:
            event = prov.parse_webhook(request)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # 2) Localiza Payment
        payment = prov.find_payment(event)
        if not payment:
            return Response({"detail": "payment não encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # 3) Audita evento bruto
        PaymentEvent.objects.create(
            payment=payment,
            event_type=event.event_type,
            provider_event_id=event.provider_event_id,
            raw_payload=_safe_payload(request.data),
        )

        # 4) Atualiza status
        # Alguns providers (ex. Mercado Pago) recomendam consultar API para obter status final
        if hasattr(prov, "refresh_status_from_api"):
            try:
                payment = prov.refresh_status_from_api(payment)
            except Exception as e:
                return Response({"detail": f"Falha ao atualizar status no provider: {e}"}, status=400)
        else:
            # Se o provider não tem refresh, usa o status normalizado do evento
            if event.status:
                payment.status = event.status
                payment.save(update_fields=["status", "updated_at"])

        # 5) Se pago, marca order como pago
        if payment.status == Payment.Status.PAID:
            payment.mark_paid()

        return Response({"ok": True}, status=status.HTTP_200_OK)


class PaymentDetailAPIView(RetrieveAPIView):
    """
    GET /api/v1/payments/<id>/
    Útil para o frontend fazer polling e mostrar status atualizado.
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


def _safe_payload(data: Any) -> Any:
    """
    Mantém payload auditável sem quebrar em caso de tipos estranhos.
    """
    try:
        # Se for JSON serializável, ok
        return data
    except Exception:
        return {"_non_serializable_payload": True}
