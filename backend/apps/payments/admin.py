from django.contrib import admin
from .models import Payment, PaymentEvent


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "provider", "method", "status", "amount", "created_at")
    list_filter = ("provider", "method", "status")
    search_fields = ("provider_payment_id", "order__id", "idempotency_key")


@admin.register(PaymentEvent)
class PaymentEventAdmin(admin.ModelAdmin):
    list_display = ("id", "payment", "event_type", "provider_event_id", "received_at")
    list_filter = ("event_type",)
