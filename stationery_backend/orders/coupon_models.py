from django.db import models
from django.utils import timezone


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
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} ({self.discount_value}{'%' if self.discount_type == 'percent' else '₹'})"

    def is_valid(self, order_amount=0):
        now = timezone.now()
        if not self.is_active:
            return False, 'Coupon is inactive'
        if self.valid_until and now > self.valid_until:
            return False, 'Coupon has expired'
        if now < self.valid_from:
            return False, 'Coupon is not yet active'
        if self.max_uses > 0 and self.uses >= self.max_uses:
            return False, 'Coupon usage limit reached'
        if order_amount < float(self.min_order_amount):
            return False, f'Minimum order amount is ₹{self.min_order_amount}'
        return True, 'Valid'
