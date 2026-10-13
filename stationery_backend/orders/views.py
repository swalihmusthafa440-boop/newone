import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.exceptions import PermissionDenied
from .models import Address, Order, Coupon
from .serializers import AddressSerializer, OrderCreateSerializer, OrderDetailSerializer, CouponSerializer

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
        if self.request.user.is_authenticated:
            if self.request.user.is_staff:
                return Order.objects.all().select_related('address', 'coupon').prefetch_related('items__product').order_by('-created_at')
            return Order.objects.filter(
                user=self.request.user
            ).select_related('address', 'coupon').prefetch_related('items__product').order_by('-created_at')
        return Order.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        result = OrderDetailSerializer(order)
        return Response(result.data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveUpdateAPIView):
    def get_queryset(self):
        return Order.objects.select_related('address', 'coupon').prefetch_related('items__product')

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
        valid, msg = coupon.is_valid_for_amount(order_amount_num)
        if not valid:
            return Response({'error': msg}, status=400)
        return Response(CouponSerializer(coupon).data)
    except Coupon.DoesNotExist:
        return Response({'error': 'Invalid or expired coupon code'}, status=400)
