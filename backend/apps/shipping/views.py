from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class ShippingQuoteAPIView(APIView):
    def post(self, request):
        zip_code = request.data.get("zip")

        if not zip_code:
            return Response(
                {"detail": "ZIP é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # MVP: regras simples
        zip_clean = zip_code.replace("-", "")

        if zip_clean.startswith(("0", "1", "2", "3")):
            quotes = [
                {"id": "pac", "label": "PAC", "price": "29.90", "days": 6},
                {"id": "sedex", "label": "SEDEX", "price": "49.90", "days": 2},
            ]
        else:
            quotes = [
                {"id": "pac", "label": "PAC", "price": "39.90", "days": 8},
                {"id": "sedex", "label": "SEDEX", "price": "69.90", "days": 3},
            ]

        return Response({"quotes": quotes})