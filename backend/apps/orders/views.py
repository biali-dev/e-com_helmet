from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from .serializers import CheckoutCreateSerializer, OrderSerializer
from .models import Order
from .serializers import OrderPublicSerializer

class CheckoutAPIView(APIView):
    def post(self, request):
        serializer = CheckoutCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = serializer.save()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

class OrderDetailAPIView(RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderPublicSerializer
