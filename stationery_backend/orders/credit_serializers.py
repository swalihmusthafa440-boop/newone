
from rest_framework import serializers
from .models import (
    Order,
    DeliveryCashHandover,
    CustomerCredit,
    CustomerCreditPayment,
)


class DeliveryCashHandoverSerializer(serializers.ModelSerializer):
    remaining_amount = serializers.ReadOnlyField()

    class Meta:
        model = DeliveryCashHandover
        fields = [
            'id', 'order', 'delivery_boy_name', 'total_amount',
            'amount_handed_over', 'remaining_amount',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order', 'created_at', 'updated_at']

    def validate(self, attrs):
        total = attrs.get(
            'total_amount',
            getattr(self.instance, 'total_amount', 0)
        )
        handed = attrs.get(
            'amount_handed_over',
            getattr(self.instance, 'amount_handed_over', 0)
        )

        if total < 0 or handed < 0:
            raise serializers.ValidationError(
                "Amounts cannot be negative."
            )
        if handed > total:
            raise serializers.ValidationError(
                "Handed-over amount cannot exceed total amount."
            )
        return attrs


class CustomerCreditPaymentSerializer(serializers.ModelSerializer):
    received_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomerCreditPayment
        fields = [
            'id', 'amount', 'method', 'notes',
            'received_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'received_by_name', 'created_at']

    def get_received_by_name(self, obj):
        if not obj.received_by:
            return ''
        return obj.received_by.get_full_name() or obj.received_by.username

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Payment must be greater than zero."
            )
        return value


class CustomerCreditSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()
    remaining_credit = serializers.ReadOnlyField()
    total_payments = serializers.ReadOnlyField()
    payments = CustomerCreditPaymentSerializer(many=True, read_only=True)
    order_date = serializers.DateTimeField(
        source='order.created_at', read_only=True
    )

    class Meta:
        model = CustomerCredit
        fields = [
            'id', 'order_id', 'order_date', 'customer_name',
            'customer_phone', 'order_amount', 'amount_paid',
            'credit_amount', 'total_payments', 'remaining_credit',
            'payments', 'created_at'
        ]
        read_only_fields = [
            'id', 'order_id', 'order_date', 'customer_name',
            'customer_phone', 'total_payments', 'remaining_credit',
            'payments', 'created_at'
        ]

    def get_customer_name(self, obj):
        address = getattr(obj.order, 'address', None)
        if address and getattr(address, 'name', None):
            return address.name
        user = obj.order.user
        if user:
            return user.get_full_name() or user.username
        return 'Guest'

    def get_customer_phone(self, obj):
        address = getattr(obj.order, 'address', None)
        if address and getattr(address, 'phone', None):
            return address.phone
        return getattr(obj.order, 'phone', '')
