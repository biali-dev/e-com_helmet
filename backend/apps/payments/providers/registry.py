from .dummy import DummyProvider
from .mercado_pago import MercadoPagoProvider

_PROVIDERS = {
    "dummy": DummyProvider(),
    "mercado_pago": MercadoPagoProvider(),
}

def get_provider(name: str):
    if name not in _PROVIDERS:
        raise RuntimeError(f"Provider '{name}' não registrado.")
    return _PROVIDERS[name]
