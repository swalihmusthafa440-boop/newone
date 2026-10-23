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

logger = logging.getLogger(__name__)


class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user,
            is_saved=True
        ).order_by('-created_at')

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
            instance.status = new_status
            instance.save()
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
