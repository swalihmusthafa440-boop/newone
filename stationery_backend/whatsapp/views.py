from rest_framework import generics
from rest_framework.permissions import IsAdminUser

from .models import WhatsAppNotification
from .serializers import WhatsAppNotificationSerializer


class WhatsAppNotificationListView(
    generics.ListAPIView
):
    serializer_class = WhatsAppNotificationSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return WhatsAppNotification.objects.all().order_by(
            "-created_at"
        )