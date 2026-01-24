import uuid
from typing import Any, Dict, Optional

from django.conf import settings
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError, PermissionDenied

from apps.orders.models import Order
from .models import Payment, PaymentEvent
from .serializers import PaymentCreateSerializer, PaymentSerializer
from .providers.registry import get_provider


class PaymentDetailAPIView(RetrieveAPIView):
    """
    GET /api/v1/payments/<id>/
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [AllowAny]


class PaymentCreateAPIView(APIView):
    """
    POST /api/v1/payments/create/

    Body:
    {
      "order_id": 123,
      "method": "pix" | "card",
      "provider": "dummy" | "mercado_pago",
      "card": { ... }   # obrigatório se method == card e provider == mercado_pago
    }

    - Para Pix: cria na hora e retorna qr_code / base64 (se provider retornar)
    - Para Card (MP): exige tokenização no frontend e envia card payload
    """
    permission_classes = [AllowAny]

    def post(self, request):
        s = PaymentCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        order_id = s.validated_data["order_id"]
        method = s.validated_data["method"]
        provider_name = s.validated_data.get("provider") or "dummy"
        card_data = s.validated_data.get("card")

        order = Order.objects.get(id=order_id)
        provider = get_provider(provider_name)

        # idempotency: se o front mandar header, usamos; senão geramos
        idempotency_key = request.headers.get("Idempotency-Key") or str(uuid.uuid4())

        # Se já existir Payment para o Order, devolve o existente (MVP)
        payment, created = Payment.objects.get_or_create(
            order=order,
            defaults={
                "provider": provider.name,
                "method": method,
                "amount": order.total,          # importante: usa TOTAL com frete
                "currency": "BRL",
                "idempotency_key": idempotency_key,
                "status": Payment.Status.CREATED,
            },
        )

        if not created:
            return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)

        # chama provider para criar o pagamento no gateway
        try:
            payment = provider.create_payment(
                payment,
                payer_email=order.email,
                card_data=card_data,
            )
        except Exception as e:
            # se falhar, remove pagamento criado para não deixar lixo
            payment.delete()
            raise ValidationError({"detail": f"Falha ao criar pagamento: {str(e)}"})

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class PayNowForMyOrderAPIView(APIView):
    """
    POST /api/v1/my/orders/<order_id>/pay/

    Cria um pagamento para um pedido DO usuário autenticado (Minha Conta),
    e devolve o Payment para redirecionar no frontend.

    Body:
    {
      "provider": "mercado_pago" | "dummy",
      "method": "pix" | "card",
      "card": {...}  # se method == card
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id: int):
        user = request.user

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"detail": "Pedido não encontrado."}, status=404)

        # segurança: só dono do pedido
        if order.user_id != user.id:
            raise PermissionDenied("Você não tem permissão para pagar este pedido.")

        # opcional: só permitir pay se aguardando pagamento
        if order.status != Order.Status.AWAITING_PAYMENT:
            return Response({"detail": "Este pedido não está aguardando pagamento."}, status=400)

        provider_name = request.data.get("provider") or "mercado_pago"
        method = request.data.get("method") or "pix"
        card_data = request.data.get("card")

        provider = get_provider(provider_name)

        # se já existe payment para este order, devolve
        existing = Payment.objects.filter(order=order).first()
        if existing:
            return Response(PaymentSerializer(existing).data, status=200)

        idempotency_key = request.headers.get("Idempotency-Key") or str(uuid.uuid4())

        payment = Payment.objects.create(
            order=order,
            provider=provider.name,
            method=method,
            amount=order.total,
            currency="BRL",
            idempotency_key=idempotency_key,
            status=Payment.Status.CREATED,
        )

        try:
            payment = provider.create_payment(
                payment,
                payer_email=order.email,
                card_data=card_data,
            )
        except Exception as e:
            payment.delete()
            raise ValidationError({"detail": f"Falha ao criar pagamento: {str(e)}"})

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class PaymentWebhookAPIView(APIView):
    """
    POST /api/v1/payments/webhook/<provider>/

    - Recebe webhook do provedor
    - Registra PaymentEvent
    - Atualiza Payment.status consultando o gateway (refresh_status_from_api)
    - Se PAID, marca Order como paid (payment.mark_paid())
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # evita CSRF/session auth em webhook

    def post(self, request, provider: str):
        prov = get_provider(provider)

        # parse event conforme provider (pode validar assinatura dentro do provider)
        try:
            event = prov.parse_webhook(request)
        except Exception as e:
            return Response({"detail": str(e)}, status=400)

        payment = prov.find_payment(event)
        if not payment:
            # webhook pode chegar antes do seu sistema persistir; responde 200 para evitar retry infinito
            return Response({"ok": True, "detail": "payment não encontrado localmente"}, status=200)

        PaymentEvent.objects.create(
            payment=payment,
            event_type=event.event_type,
            provider_event_id=event.provider_event_id,
            raw_payload=event.raw,
        )

        # sempre preferir buscar status real no gateway (quando disponível)
        try:
            if hasattr(prov, "refresh_status_from_api"):
                payment = prov.refresh_status_from_api(payment)
            else:
                # fallback: usa status do event (normalizado)
                payment.status = event.status
                payment.save(update_fields=["status", "updated_at"])
        except Exception as e:
            return Response({"detail": f"Falha ao atualizar status: {str(e)}"}, status=400)

        if payment.status == Payment.Status.PAID:
            payment.mark_paid()

        return Response({"ok": True})