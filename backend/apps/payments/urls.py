from django.urls import path
from .views import PaymentCreateAPIView, PaymentWebhookAPIView, PaymentDetailAPIView

urlpatterns = [
    path("payments/create/", PaymentCreateAPIView.as_view(), name="payment-create"),
    path("payments/webhook/", PaymentWebhookAPIView.as_view(), name="payment-webhook"),
    path("payments/<int:pk>/", PaymentDetailAPIView.as_view(), name="payment-detail"),
]
