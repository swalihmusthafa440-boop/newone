
from django.conf import settings
from django.db import models


class UserRole(models.Model):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('shop_owner', 'Shop Owner'),
        ('admin', 'Admin'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='role_info'
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='customer'
    )

    def __str__(self):
        return f'{self.user.username} - {self.role}'
