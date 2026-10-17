from django.contrib import admin
from .models import Order, OrderItem, Address, Coupon


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['unit_price', 'subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_customer_name', 'status', 'payment_method', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['id', 'address__name', 'user__username']
    list_editable = ['status']
    readonly_fields = ['created_at', 'updated_at', 'discount_amount']
    inlines = [OrderItemInline]
    ordering = ['-created_at']

    def get_customer_name(self, obj):
        if obj.address:
            return obj.address.name
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return 'Guest'
    get_customer_name.short_description = 'Customer'


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['name', 'state',  'user', 'is_saved']
    search_fields = ['name',]
    list_filter = ['state', 'is_saved']


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'discount_value', 'is_active', 'uses', 'valid_until']
    list_editable = ['is_active']
    search_fields = ['code']
