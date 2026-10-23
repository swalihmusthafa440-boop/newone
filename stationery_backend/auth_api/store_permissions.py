
from rest_framework.exceptions import PermissionDenied

from .models import Store, UserRole


def is_superuser(user):
    return user.is_authenticated and user.is_superuser


def get_owned_store(user):
    if not user.is_authenticated:
        raise PermissionDenied("Login required.")

    if user.is_superuser:
        return None

    role = UserRole.objects.filter(user=user).first()

    if not role or role.role not in ("shop_owner", "admin"):
        raise PermissionDenied("Store admin access required.")

    store = Store.objects.filter(
        owner=user,
        is_active=True,
    ).first()

    if store is None:
        raise PermissionDenied(
            "No active store is assigned to this account."
        )

    return store
