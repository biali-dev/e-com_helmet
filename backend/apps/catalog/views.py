from rest_framework import generics
from .models import Product
from .serializers import ProductListSerializer, ProductDetailSerializer


class ProductListAPIView(generics.ListAPIView):
    queryset = Product.objects.filter(active=True).prefetch_related("images", "category", "brand")
    serializer_class = ProductListSerializer


class ProductDetailAPIView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(active=True).prefetch_related("images", "category", "brand")
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"
