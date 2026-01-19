from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import CheckoutCreateSerializer, OrderSerializer


class CheckoutAPIView(APIView):
    def post(self, request):
        serializer = CheckoutCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = serializer.save()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
