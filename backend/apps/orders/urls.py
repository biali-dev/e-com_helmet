from django.urls import path
from .views import CheckoutAPIView, ClaimGuestOrdersAPIView, OrderDetailAPIView, MyOrderDetailAPIView, MyOrdersListAPIView

urlpatterns = [
    path("checkout/", CheckoutAPIView.as_view(), name="checkout"),
    path("orders/<int:pk>/", OrderDetailAPIView.as_view(), name="order-detail"),
    path("my/orders/", MyOrdersListAPIView.as_view(), name="my-orders"),
    path("my/orders/<int:id>/", MyOrderDetailAPIView.as_view(), name="my-order-detail"),
    path("my/orders/claim/", ClaimGuestOrdersAPIView.as_view(), name="my-orders-claim"),
]
