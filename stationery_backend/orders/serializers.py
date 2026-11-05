from rest_framework import serializers
from django.db import transaction
from .models import Address, Order, OrderItem, Coupon
from products.models import Product
from decimal import Decimal
from math import radians, sin, cos, asin, sqrt, ceil


def calculate_distance_meters(lat1, lon1, lat2, lon2):
    """Calculate distance between shop and customer."""

    earth_radius_meters = 6371000

    lat1, lon1, lat2, lon2 = map(
        radians,
        [float(lat1), float(lon1), float(lat2), float(lon2)]
    )

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    )

    distance = 2 * earth_radius_meters * asin(sqrt(a))

    return ceil(distance)


def calculate_delivery_charge(distance_meters):

    if distance_meters <= 350:
        return Decimal('0.00')

    elif distance_meters <= 700:
        return Decimal('2.00')

    elif distance_meters <= 1000:
        return Decimal('4.00')

    else:
        extra_blocks = ceil((distance_meters - 1000) / 300)

        return Decimal(
            str(4 + (extra_blocks * 2))
        ).quantize(Decimal('0.01'))


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['id', 'code', 'description', 'discount_type', 'discount_value', 'min_order_amount']


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'name', 'phone', 'address_line1','state', 'is_saved','latitude','longitude', 'created_at']


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
            'discount_amount', 'phone','delivery_charge','delivery_distance_meters','notification_email',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'total_amount', 'discount_amount','delivery_charge','delivery_distance_meters',]

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
            address_data = dict(address_data)

            if user:
                address_data['user'] = user

            # Reuse the selected customer's saved address when possible.
            address_id_from_data = address_data.pop('id', None)

            if user and address_id_from_data:
                try:
                    address = Address.objects.get(
                        id=address_id_from_data,
                        user=user
                    )
                except Address.DoesNotExist:
                    raise serializers.ValidationError({
                        'address_data': 'Selected address does not exist or access is denied.'
                    })

                for field, value in address_data.items():
                    setattr(address, field, value)

                address.save()
            else:
                if user and address_data.get('is_saved', False):
                    from django.db.models import Q
            
                    address_line = (address_data.get('address_line1') or '').strip()
                    state = (address_data.get('state') or '').strip()
            
                    existing_addresses = Address.objects.filter(
                        user=user,
                        is_saved=True,
                        address_line1__iexact=address_line,
                        state__iexact=state
                    ).order_by('-created_at')
            
                    # Same address and approximately same map location
                    address = None
            
                    new_lat = address_data.get('latitude')
                    new_lng = address_data.get('longitude')
            
                    for old_address in existing_addresses:
                        same_location = (
                            new_lat is not None
                            and new_lng is not None
                            and old_address.latitude is not None
                            and old_address.longitude is not None
                            and round(float(old_address.latitude), 4) == round(float(new_lat), 4)
                            and round(float(old_address.longitude), 4) == round(float(new_lng), 4)
                        )
            
                        if same_location:
                            address = old_address
                            break
                        
                    if address is None:
                        address = Address.objects.create(**address_data)
                else:
                    address = Address.objects.create(**address_data)
                
            validated_data['phone'] = (
                validated_data.get('phone') or address.phone
            )

        elif address_id:
            try:
                if user and not user.is_staff:
                    address = Address.objects.get(
                        id=address_id,
                        user=user
                    )
                else:
                    address = Address.objects.get(id=address_id)

            except Address.DoesNotExist:
                raise serializers.ValidationError({
                    'address_id': 'Selected address does not exist or access is denied.'
                })

            validated_data['phone'] = (
                validated_data.get('phone') or address.phone
            )

        else:
            raise serializers.ValidationError(
                'Either address_data or address_id is required.'
            )

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

        # Assign the order to the store that owns its products
        stores = [product.store for product, qty, price in items_to_create]

        if any(store is None for store in stores):
            raise serializers.ValidationError({
                "store": "One or more products have no assigned store."
            })

        store_ids = {store.id for store in stores}

        if len(store_ids) != 1:
            raise serializers.ValidationError({
                "store": "Please order products from one store at a time."
            })

        store = stores[0]
        
        # Validate coupon and enforce one use per account
        coupon_obj = None
        discount_amount = 0.0

        if coupon_code:
            if not user:
                raise serializers.ValidationError({
                    'coupon_code': 'Please log in to use a coupon.'
                })

            try:
                coupon_candidate = Coupon.objects.select_for_update().get(
                    code=coupon_code.strip().upper()
                )
            except Coupon.DoesNotExist:
                raise serializers.ValidationError({
                    'coupon_code': 'Invalid coupon code.'
                })

            # Prevent the same account from using this coupon again
            already_used = Order.objects.filter(
                user=user,
                coupon=coupon_candidate
            ).exists()

            if already_used:
                raise serializers.ValidationError({
                    'coupon_code': 'You have already used this coupon.'
                })

            valid, msg = coupon_candidate.is_valid_for_amount(subtotal)

            if not valid:
                raise serializers.ValidationError({
                    'coupon_code': msg
                })

            coupon_obj = coupon_candidate

            if coupon_obj.discount_type == 'percent':
                discount_amount = round(
                    subtotal * float(coupon_obj.discount_value) / 100.0,
                    2
                )
            else:
                discount_amount = min(
                    float(coupon_obj.discount_value),
                    subtotal
                )

        final_total = max(0.0, round(subtotal - discount_amount, 2))

        # Check shop and customer locations

        if (
            store.latitude is None
            or store.longitude is None
            or address.latitude is None
            or address.longitude is None
        ):
            raise serializers.ValidationError({
                'delivery_location': (
                    'Shop location and customer delivery location '
                    'are required.'
                )
            })
        delivery_distance_meters = calculate_distance_meters(
            store.latitude,
            store.longitude,
            address.latitude,
            address.longitude
        )

        delivery_charge = calculate_delivery_charge(
            delivery_distance_meters
        )
        final_total = (
            Decimal(str(max(0, round(subtotal - discount_amount, 2)))
            ) + delivery_charge
        ).quantize(Decimal('0.01'))



        order = Order.objects.create(
            address=address,
            user=user,
            store=store,
            coupon=coupon_obj,
            discount_amount=Decimal(str(discount_amount)).quantize(Decimal('0.01')),
            delivery_charge=delivery_charge,
            delivery_distance_meters=delivery_distance_meters,
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
            'discount_amount', 'coupon', 'notes', 'items', 'created_at', 'updated_at','delivery_charge',
            'delivery_distance_meters','notification_email',
        ]
