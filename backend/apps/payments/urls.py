from django.urls import path
from .views import PaymentCreateAPIView, PaymentDetailAPIView, PaymentWebhookAPIView, PayNowForMyOrderAPIView

urlpatterns = [
    path("payments/create/", PaymentCreateAPIView.as_view(), name="payment-create"),
    path("payments/<int:pk>/", PaymentDetailAPIView.as_view(), name="payment-detail"),
    path("payments/webhook/<str:provider>/", PaymentWebhookAPIView.as_view(), name="payment-webhook"),
    path("my/orders/<int:order_id>/pay/", PayNowForMyOrderAPIView.as_view(), name="my-order-pay"),
]