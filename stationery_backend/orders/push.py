import json
import logging

from django.conf import settings
from pywebpush import webpush, WebPushException

from .models import PushSubscription

logger = logging.getLogger(__name__)



def send_push_notification(user, title, body, url='/orders'):
    subscriptions = PushSubscription.objects.filter(user=user)

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth,
                    },
                },
                data=json.dumps({
                    "title": title,
                    "body": body,
                    "url": url,
                }),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": settings.VAPID_ADMIN_EMAIL
                },
            )

            logger.info(
                "Push notification sent to user %s",
                user.id
            )

        except WebPushException as exc:
            status_code = (
                exc.response.status_code
                if exc.response is not None
                else None
            )

            if status_code in (404, 410):
                logger.warning(
                    "Removing invalid push subscription for user %s",
                    user.id
                )
                sub.delete()
            else:
                logger.exception("Push notification failed")

        except Exception:
            logger.exception("Unexpected push notification error")
