from django.db import models
from django.contrib.auth.models import User
from products.models import Product
from django.conf import settings


from decimal import Decimal
from django.core.exceptions import ValidationError

class Coupon(models.Model):
    DISCOUNT_TYPES = [
        ('percent', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]
    code = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=200, blank=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPES, default='percent')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.PositiveIntegerField(default=0, help_text='0 = unlimited')
    uses = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} ({self.discount_value}{'%' if self.discount_type == 'percent' else '₹ off'})"

    def is_valid_for_amount(self, order_amount=0):
        from django.utils import timezone
        now = timezone.now()
        if not self.is_active:
            return False, 'Coupon is inactive'
        if self.valid_until and now > self.valid_until:
            return False, 'Coupon has expired'
        if self.max_uses > 0 and self.uses >= self.max_uses:
            return False, 'Coupon usage limit reached'
        if float(order_amount) < float(self.min_order_amount):
            return False, f'Minimum order amount is ₹{self.min_order_amount}'
        return True, 'Valid'


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='addresses')
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    address_line1 = models.CharField(max_length=300)

    state = models.CharField(max_length=100)

    is_saved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    class Meta:
        verbose_name_plural = 'addresses'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} `"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_CHOICES = [
        ('cod', 'Cash on Delivery'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    address = models.ForeignKey(Address, on_delete=models.PROTECT,null=True,blank=True)
    phone = models.CharField(max_length=15, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='cod')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_charge = models.DecimalField(max_digits=10,decimal_places=2,default=0)
    delivery_distance_meters = models.PositiveIntegerField(default=0)
    notification_email = models.EmailField(blank=True,null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    store = models.ForeignKey(
        "auth_api.Store",
        on_delete=models.PROTECT,
        related_name="orders",
        null=True,
        blank=True,
    )


    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        name = self.address.name if self.address else 'Guest'
        return f"Order #{self.id} - {name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=200, blank=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def subtotal(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"






class DeliveryCashHandover(models.Model):
    order = models.OneToOneField(
        'Order',
        on_delete=models.CASCADE,
        related_name='delivery_handover'
    )
    delivery_boy_name = models.CharField(max_length=150)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_handed_over = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='delivery_handovers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def remaining_amount(self):
        return self.total_amount - self.amount_handed_over

    def clean(self):
        if self.total_amount < 0 or self.amount_handed_over < 0:
            raise ValidationError("Amounts cannot be negative.")
        if self.amount_handed_over > self.total_amount:
            raise ValidationError(
                "Amount handed over cannot exceed the total amount."
            )

    def __str__(self):
        return f"Cash handover for Order #{self.order_id}"


class CustomerCredit(models.Model):
    order = models.OneToOneField(
        'Order',
        on_delete=models.CASCADE,
        related_name='customer_credit'
    )
    order_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_payments(self):
        return self.payments.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')

    @property
    def remaining_credit(self):
        return max(
            Decimal('0.00'),
            self.credit_amount - self.total_payments
        )

    def clean(self):
        if min(self.order_amount, self.amount_paid, self.credit_amount) < 0:
            raise ValidationError("Amounts cannot be negative.")
        if self.amount_paid + self.credit_amount != self.order_amount:
            raise ValidationError(
                "Amount paid plus credit must equal order amount."
            )

    def __str__(self):
        return f"Credit for Order #{self.order_id}"


class CustomerCreditPayment(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
    ]

    credit = models.ForeignKey(
        CustomerCredit,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(
        max_length=10,
        choices=PAYMENT_METHODS,
        default='cash'
    )
    notes = models.CharField(max_length=250, blank=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.amount <= 0:
            raise ValidationError("Payment must be greater than zero.")

    def __str__(self):
        return f"Payment ₹{self.amount} for credit #{self.credit_id}"

class CustomerCreditPermission(models.Model):
    store = models.ForeignKey(
        'auth_api.Store',
        on_delete=models.CASCADE,
        related_name='customer_credit_permissions'
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='store_credit_permissions'
    )
    is_allowed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['store', 'customer'],
                name='unique_store_customer_credit_permission'
            )
        ]

    def __str__(self):
        status = 'Allowed' if self.is_allowed else 'Not Allowed'
        return f'{self.store.name} - {self.customer.username} - {status}'


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=150)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} - {self.user}'

class PushSubscription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_subscriptions'
    )
    endpoint = models.URLField(max_length=1000, unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Push subscription - {self.user}"

