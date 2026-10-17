from rest_framework import serializers
from django.db import transaction
from .models import Address, Order, OrderItem, Coupon
from products.models import Product


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['id', 'code', 'description', 'discount_type', 'discount_value', 'min_order_amount']


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'name', 'phone', 'address_line1','state', 'is_saved', 'created_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'subtotal']

    def get_product_name(self, obj):
        return obj.product_name or (obj.product.name if obj.product else 'Item')


class OrderCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), write_only=True)
    address_data = AddressSerializer(write_only=True, required=False)
    address_id = serializers.IntegerField(write_only=True, required=False)
    coupon_code = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = [
            'id', 'address_data', 'address_id', 'payment_method', 'notes',
            'items', 'total_amount', 'status', 'created_at', 'coupon_code',
            'discount_amount', 'phone'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'total_amount', 'discount_amount']

    def validate_items(self, value):
        if not value or not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError('Order must contain at least one item.')
        for item in value:
            if not isinstance(item, dict) or 'product_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError('Each item must contain product_id and quantity.')
            try:
                qty = int(item['quantity'])
                if qty <= 0:
                    raise serializers.ValidationError('Quantity must be greater than 0.')
            except (ValueError, TypeError):
                raise serializers.ValidationError('Invalid quantity value.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        address_data = validated_data.pop('address_data', None)
        address_id = validated_data.pop('address_id', None)
        coupon_code = validated_data.pop('coupon_code', None)
        # Remove total_amount and discount_amount from client input to prevent manipulation
        validated_data.pop('total_amount', None)
        validated_data.pop('discount_amount', None)

        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        if address_data:
            if user:
                address_data['user'] = user
            address = Address.objects.create(**address_data)
            validated_data['phone'] = validated_data.get('phone') or address.phone
        elif address_id:
            try:
                if user and not user.is_staff:
                    address = Address.objects.get(id=address_id, user=user)
                else:
                    address = Address.objects.get(id=address_id)
            except Address.DoesNotExist:
                raise serializers.ValidationError({'address_id': 'Selected address does not exist or access is denied.'})
            validated_data['phone'] = validated_data.get('phone') or address.phone
        else:
            raise serializers.ValidationError('Either address_data or address_id is required.')

        # Validate items and calculate authoritative subtotal
        subtotal = 0.0
        items_to_create = []
        for item in items_data:
            try:
                product = Product.objects.select_for_update().get(id=item['product_id'])
            except Product.DoesNotExist:
                raise serializers.ValidationError({'items': f"Product ID {item['product_id']} not found."})

            if not product.is_active:
                raise serializers.ValidationError({'items': f"Product '{product.name}' is currently unavailable."})

            qty = int(item['quantity'])
            if qty <= 0:
                raise serializers.ValidationError({'items': 'Item quantity must be greater than zero.'})

            if product.stock < qty:
                raise serializers.ValidationError({'items': f"Insufficient stock for '{product.name}'. Available: {product.stock}."})

            unit_price = float(product.price)
            subtotal += unit_price * qty
            items_to_create.append((product, qty, product.price))

        # Handle coupon with authoritative discount calculation
        coupon_obj = None
        discount_amount = 0.0
        if coupon_code:
            try:
                coupon_candidate = Coupon.objects.get(code=coupon_code.strip().upper(), is_active=True)
                valid, msg = coupon_candidate.is_valid_for_amount(subtotal)
                if valid:
                    coupon_obj = coupon_candidate
                    if coupon_obj.discount_type == 'percent':
                        discount_amount = round(subtotal * float(coupon_obj.discount_value) / 100.0, 2)
                    else:
                        discount_amount = min(float(coupon_obj.discount_value), subtotal)
                else:
                    coupon_obj = None
            except Coupon.DoesNotExist:
                coupon_obj = None

        final_total = max(0.0, round(subtotal - discount_amount, 2))

        order = Order.objects.create(
            address=address,
            user=user,
            coupon=coupon_obj,
            discount_amount=discount_amount,
            total_amount=final_total,
            **validated_data
        )

        for product, qty, unit_price in items_to_create:
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                quantity=qty,
                unit_price=unit_price,
            )
            product.stock = max(0, product.stock - qty)
            product.save(update_fields=['stock'])

        if coupon_obj:
            coupon_obj.uses += 1
            coupon_obj.save(update_fields=['uses'])

        return order


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    address = AddressSerializer(read_only=True)
    coupon = CouponSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'address', 'phone', 'payment_method', 'status', 'total_amount',
            'discount_amount', 'coupon', 'notes', 'items', 'created_at', 'updated_at'
        ]
