from django.urls import path
from .views import CheckoutAPIView, OrderDetailAPIView

urlpatterns = [
    path("checkout/", CheckoutAPIView.as_view(), name="checkout"),
    path("orders/<int:pk>/", OrderDetailAPIView.as_view(), name="order-detail"),
]
