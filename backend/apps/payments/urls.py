from django.urls import path
from .views import PaymentCreateAPIView, PaymentWebhookAPIView, PaymentDetailAPIView

urlpatterns = [
    path("payments/create/", PaymentCreateAPIView.as_view()),
    path("payments/webhook/<str:provider>/", PaymentWebhookAPIView.as_view()),
    path("payments/<int:pk>/", PaymentDetailAPIView.as_view()),
]
