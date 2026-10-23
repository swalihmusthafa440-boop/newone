from django.urls import path

from .views import WhatsAppNotificationListView


urlpatterns = [
    path(
        "notifications/",
        WhatsAppNotificationListView.as_view(),
        name="whatsapp-notifications",
    ),
]