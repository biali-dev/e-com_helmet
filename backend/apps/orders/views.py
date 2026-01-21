from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from .serializers import CheckoutCreateSerializer, OrderSerializer
from .models import Order
from .serializers import OrderPublicSerializer
from rest_framework.permissions import IsAuthenticated

class CheckoutAPIView(APIView):
    def post(self, request):
        serializer = CheckoutCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        order = serializer.save()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

class OrderDetailAPIView(RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderPublicSerializer

class MyOrdersListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by("-id")

class ClaimGuestOrdersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Vincula pedidos guest (user is null) ao usuário logado,
        usando o e-mail como chave.
        """
        user = request.user
        email = (user.email or "").strip()

        if not email:
            return Response(
                {"claimed": 0, "detail": "Usuário sem e-mail cadastrado."},
                status=400,
            )

        # vincula pedidos guest do mesmo e-mail (case-insensitive)
        qs = Order.objects.filter(user__isnull=True, email__iexact=email)

        # opcional: não mexer em cancelados
        # qs = qs.exclude(status=Order.Status.CANCELED)

        claimed = qs.update(user=user)
        return Response({"claimed": claimed})

class MyOrderDetailAPIView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    lookup_field = "id"

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)