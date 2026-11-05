import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.exceptions import PermissionDenied
from .models import Address, Order, Coupon
from .serializers import AddressSerializer, OrderCreateSerializer, OrderDetailSerializer, CouponSerializer
from django.db import transaction
from whatsapp.services import send_order_notification
from auth_api.store_permissions import get_owned_store
from .models import Notification
from rest_framework.views import APIView
from .models import PushSubscription
from .push import send_push_notification
from products.models import Product

from .serializers import (
    calculate_distance_meters,
    calculate_delivery_charge
)

logger = logging.getLogger(__name__)



@api_view(['POST'])
@permission_classes([AllowAny])
def delivery_charge_preview(request):
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    product_ids = request.data.get('product_ids')

    if latitude is None or longitude is None:
        return Response(
            {'error': 'Customer location is required.'},
            status=400
        )

    if not isinstance(product_ids, list) or not product_ids:
        return Response(
            {'error': 'Product IDs are required.'},
            status=400
        )

    try:
        products = Product.objects.filter(
            id__in=product_ids,
            is_active=True
        ).select_related('store')

        if products.count() != len(set(product_ids)):
            return Response(
                {'error': 'One or more products are unavailable.'},
                status=400
            )

        stores = {p.store_id for p in products}

        if None in stores or len(stores) != 1:
            return Response(
                {'error': 'Products must belong to one store.'},
                status=400
            )

        store = products[0].store

        if store.latitude is None or store.longitude is None:
            return Response(
                {'error': 'Store location is not configured.'},
                status=400
            )

        distance = calculate_distance_meters(
            store.latitude,
            store.longitude,
            latitude,
            longitude
        )

        charge = calculate_delivery_charge(distance)

        return Response({
            'delivery_charge': str(charge)
        })

    except (ValueError, TypeError):
        return Response(
            {'error': 'Invalid location coordinates.'},
            status=400
        )



class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user,
            is_saved=True
        ).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        serializer = self.get_serializer(queryset, many=True)

        unique_addresses = []
        seen = set()

        for address in serializer.data:
            key = (
                (address.get('address_line1') or '').strip().lower(),
                (address.get('state') or '').strip().lower(),
                round(float(address['latitude']), 4)
                    if address.get('latitude') is not None else None,
                round(float(address['longitude']), 4)
                    if address.get('longitude') is not None else None,
            )

            if key not in seen:
                seen.add(key)
                unique_addresses.append(address)

        return Response(unique_addresses)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class OrderListCreateView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        user = self.request.user

        queryset = Order.objects.select_related(
            "address", "coupon", "store"
        ).prefetch_related(
            "items__product"
        ).order_by("-created_at")

        if not user.is_authenticated:
            return Order.objects.none()

        # Platform superuser can view every store's orders
        if user.is_superuser:
            return queryset

        # Store admin can view only their own store's orders
        if user.is_staff:
            store = get_owned_store(user)
            return queryset.filter(store=store)

        # Customers can view only their own orders
        return queryset.filter(user=user)


    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(
            data=request.data,
            context={"request": request},
        )
    
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
    
        # Order database-ൽ commit ചെയ്തശേഷം notification അയയ്ക്കുക.
        transaction.on_commit(
            lambda order_id=order.pk:
                self._send_whatsapp_for_order(order_id)
        )
    
        result = OrderDetailSerializer(order)
    
        return Response(
            result.data,
            status=status.HTTP_201_CREATED,
        )
    
    
    @staticmethod
    def _send_whatsapp_for_order(order_id):
        try:
            order = (
                Order.objects
                .select_related("address", "user")
                .prefetch_related("items__product")
                .get(pk=order_id)
            )
    
            send_order_notification(order)
    
        except Exception:
            logger.exception(
                "WhatsApp notification failed for order %s",
                order_id,
            )

class OrderDetailView(generics.RetrieveUpdateAPIView):
    def get_queryset(self):
        user = self.request.user
    
        queryset = Order.objects.select_related(
            "address", "coupon", "store"
        ).prefetch_related(
            "items__product"
        )
    
        if not user.is_authenticated:
            return queryset.none()
    
        if user.is_superuser:
            return queryset
    
        if user.is_staff:
            store = get_owned_store(user)
            return queryset.filter(store=store)
    
        return queryset.filter(user=user)
    def get_serializer_class(self):
        return OrderDetailSerializer

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Enforce strict customer privacy:
        # If the order is linked to a customer user, only that customer or staff can view it.
        if instance.user:
            if not request.user.is_authenticated:
                raise PermissionDenied('Please log in to view your order details.')
            if not request.user.is_staff and instance.user != request.user:
                raise PermissionDenied('You do not have permission to view this order.')
        return Response(OrderDetailSerializer(instance).data)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')
        if not new_status or new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status choice.'}, status=400)



        # Admin / staff can update to any status
        if request.user.is_staff:
            old_status = instance.status

            instance.status = new_status
            instance.save()

            # Notify customer only when order becomes confirmed
            if (
                old_status != 'confirmed'
                and new_status == 'confirmed'
                and instance.user
            ):
                Notification.objects.create(
                    user=instance.user,
                    order=instance,
                    title='Order Confirmed',
                    message=f'Your #{instance.id} order is confirmed.'
                )

                send_push_notification(
                    user=instance.user,
                    title='Order Confirmed',
                    body=f'Your #{instance.id} order has been confirmed.',
                    url='/orders'
                )

            return Response(OrderDetailSerializer(instance).data)



        # Customer can cancel their own pending order
        if instance.user == request.user and instance.status == 'pending' and new_status == 'cancelled':
            instance.status = 'cancelled'
            instance.save()
            return Response(OrderDetailSerializer(instance).data)

        return Response({'error': 'You do not have permission to update this order status.'}, status=403)


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_coupon(request):
    code = request.data.get('code', '').strip().upper()
    order_amount = request.data.get('order_amount', 0)
    try:
        order_amount_num = float(order_amount or 0)
    except (ValueError, TypeError):
        order_amount_num = 0.0

    if not code:
        return Response({'error': 'Coupon code is required'}, status=400)
    
    try:
        coupon = Coupon.objects.get(code=code)

        if not request.user.is_authenticated:
            return Response(
                {'error': 'Please log in to use a coupon.'},
                status=400
            )

        already_used = Order.objects.filter(
            user=request.user,
            coupon=coupon
        ).exists()

        if already_used:
            return Response(
                {'error': 'You have already used this coupon.'},
                status=400
            )

        valid, msg = coupon.is_valid_for_amount(order_amount)

        if not valid:
            return Response({'error': msg}, status=400)

        return Response(CouponSerializer(coupon).data)

    except Coupon.DoesNotExist:
        return Response(
            {'error': 'Invalid or expired coupon code'},
            status=400
        )
    
    
class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(
            user=request.user
        )

        data = [
            {
                'id': n.id,
                'order_id': n.order_id,
                'title': n.title,
                'message': n.message,
                'is_read': n.is_read,
                'created_at': n.created_at,
            }
            for n in notifications
        ]

        unread_count = notifications.filter(is_read=False).count()

        return Response({
            'notifications': data,
            'unread_count': unread_count
        })


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(
                pk=pk,
                user=request.user
            )
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=404
            )

        notification.is_read = True
        notification.save(update_fields=['is_read'])

        return Response({'message': 'Notification marked as read'})


class PushSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        subscription = request.data

        endpoint = subscription.get('endpoint')
        keys = subscription.get('keys', {})

        p256dh = keys.get('p256dh')
        auth = keys.get('auth')

        if not endpoint or not p256dh or not auth:
            return Response(
                {'error': 'Invalid subscription data'},
                status=400
            )

        PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                'user': request.user,
                'p256dh': p256dh,
                'auth': auth,
            }
        )

        return Response({'message': 'Subscription saved successfully'})