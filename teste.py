from backend.config import settings


token = settings.MERCADOPAGO_ACCESS_TOKEN
print("MP token prefix:", token[:10])
