from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Optional, Protocol

from apps.payments.models import Payment


@dataclass
class WebhookEvent:
    provider: str
    event_type: str
    provider_event_id: str
    provider_payment_id: str
    status: str
    raw: Any


class PaymentProvider(Protocol):
    name: str

    def create_payment(self, payment: Payment, *, payer_email: str, card_data: dict | None = None) -> Payment:
        ...

    def parse_webhook(self, request) -> WebhookEvent:
        ...

    def find_payment(self, event: WebhookEvent) -> Optional[Payment]:
        ...
