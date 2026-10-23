from rest_framework import serializers
from .models import WhatsAppNotification


class WhatsAppNotificationSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = WhatsAppNotification

        fields = [
            "id",
            "order_id",
            "customer_name",
            "customer_phone",
            "message",
            "status",
            "whatsapp_message_id",
            "error_message",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields