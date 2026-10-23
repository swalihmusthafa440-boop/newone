from django.contrib import admin

from .models import WhatsAppNotification


@admin.register(WhatsAppNotification)
class WhatsAppNotificationAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "order_id",
        "customer_name",
        "customer_phone",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "order_id",
        "customer_name",
        "customer_phone",
        "whatsapp_message_id",
    )

    readonly_fields = (
        "order_id",
        "customer_name",
        "customer_phone",
        "message",
        "status",
        "whatsapp_message_id",
        "error_message",
        "created_at",
        "updated_at",
    )