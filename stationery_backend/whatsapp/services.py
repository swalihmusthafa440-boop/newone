import logging
import requests

from django.conf import settings
from .models import WhatsAppNotification

logger = logging.getLogger(__name__)


def send_order_notification(order):
    notification = None

    try:
        address = order.address
        user = order.user

        customer_name = (
            getattr(address, "name", "")
            if address else ""
        )

        if not customer_name and user:
            customer_name = (
                user.get_full_name() or user.username
            )

        customer_name = customer_name or "Customer"

        customer_phone = (
            order.phone
            or (address.phone if address else "")
        )

        product_lines = []

        for item in order.items.select_related(
            "product"
        ).all():
            name = (
                item.product_name
                or item.product.name
            )

            product_lines.append(
                f"• {name} x {item.quantity}"
            )

        products_text = "; ".join(product_lines)
        products_text = " ".join(products_text.split())

        address_parts = []

        if address:
            if address.address_line1:
                address_parts.append(
                    address.address_line1
                )

            if address.state:
                address_parts.append(address.state)

        delivery_address = (
            ", ".join(address_parts) or "Not provided"
        )

        payment_method = order.get_payment_method_display()

        message = (
            "STATIOMART - NEW ORDER\n\n"
            f"Order ID: {order.id}\n"
            f"Customer: {customer_name}\n"
            f"Phone: {customer_phone}\n\n"
            f"Products:\n{products_text}\n\n"
            f"Total: Rs. {order.total_amount}\n"
            f"Delivery: {delivery_address}\n"
            f"Payment: {payment_method}\n"
            f"Status: {order.get_status_display()}"
        )

        notification = WhatsAppNotification.objects.create(
            order_id=str(order.id),
            customer_name=str(customer_name)[:150],
            customer_phone=str(customer_phone)[:30],
            message=message,
            status="pending",
        )

        
        token = settings.WHATSAPP_ACCESS_TOKEN
        phone_id = settings.WHATSAPP_PHONE_NUMBER_ID
        api_version = settings.WHATSAPP_API_VERSION
        
        # Select WhatsApp recipient
        token = settings.WHATSAPP_ACCESS_TOKEN
        phone_id = settings.WHATSAPP_PHONE_NUMBER_ID
        api_version = settings.WHATSAPP_API_VERSION

        if not all([token, phone_id, api_version]):
            raise ValueError("WhatsApp API settings are incomplete.")

        if not order.store_id:
            raise ValueError(
                f"Order {order.id} has no assigned store."
            )

        recipient = order.store.admin_whatsapp_number

        if not recipient:
            raise ValueError(
                f"No WhatsApp number configured for store {order.store_id}."
            )        

        
        if not recipient:
            raise ValueError("WhatsApp recipient number is missing.")
                
        # Keep the existing Meta API settings
        if not all([token, phone_id, api_version]):
            raise ValueError(
                "WhatsApp API settings are incomplete."
            )
        
        if not all([
            token,
            phone_id,
            api_version,
        ]):
            raise ValueError(
                "WhatsApp API settings are incomplete."
            )

        url = (
            f"https://graph.facebook.com/"
            f"{api_version}/{phone_id}/messages"
        )

        template_name = getattr(
            settings,
            "WHATSAPP_ORDER_TEMPLATE_NAME",
            "new_order_notification",
        )

        template_language = getattr(
            settings,
            "WHATSAPP_ORDER_TEMPLATE_LANGUAGE",
            "en",
        )

        payload = {
            "messaging_product": "whatsapp",
            "to": recipient,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": template_language,
                },
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "text": str(customer_name)[:200],
                            },
                            {
                                "type": "text",
                                "text": str(customer_phone)[:200]
                                or "Not provided",
                            },
                            {
                                "type": "text",
                                "text": str(order.id),
                            },
                            {
                                "type": "text",
                                "text": " ".join(
                                    (products_text or "No items").split()
                                )[:900],
                            },
                            {
                                "type": "text",
                                "text": str(order.total_amount),
                            },
                        ],
                    }
                ],
            },
        }

        response = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=20,
        )

        try:
            response_data = response.json()
        except ValueError:
            response_data = {}

        if not response.ok:
            error_data = response_data.get(
                "error", response_data
            )

            raise RuntimeError(
                f"WhatsApp API error "
                f"{response.status_code}: "
                f"{str(error_data)[:1500]}"
            )

        messages = response_data.get("messages", [])

        notification.status = "sent"

        if messages:
            notification.whatsapp_message_id = (
                messages[0].get("id", "")
            )

        notification.error_message = ""

        notification.save(
            update_fields=[
                "status",
                "whatsapp_message_id",
                "error_message",
                "updated_at",
            ]
        )

        return True

    except Exception as exc:
        logger.exception(
            "StatioMart WhatsApp notification failed"
        )

        if notification is not None:
            notification.status = "failed"
            notification.error_message = str(exc)[:2000]

            notification.save(
                update_fields=[
                    "status",
                    "error_message",
                    "updated_at",
                ]
            )

        return False