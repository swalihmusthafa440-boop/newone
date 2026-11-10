from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection
from django.contrib.auth import get_user_model
import os
import json
from django.views.decorators.csrf import csrf_exempt


def api_home(request):
    return JsonResponse({
        "message": "StatioMart API is running successfully!",
        "status": "success"
    })



def database_check(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database()")
        db_name = cursor.fetchone()[0]

    User = get_user_model()
    admin_user = User.objects.filter(username="admin").first()

    return JsonResponse({
        "database": db_name,
        "status": "connected",
        "admin_exists": admin_user is not None,
        "is_active": admin_user.is_active if admin_user else False,
        "is_staff": admin_user.is_staff if admin_user else False,
        "is_superuser": admin_user.is_superuser if admin_user else False,
    })


@csrf_exempt
def admin_password_check(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    diagnostic_key = os.environ.get("ADMIN_DIAGNOSTIC_KEY")

    if not diagnostic_key or request.headers.get("X-Diagnostic-Key") != diagnostic_key:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    try:
        data = json.loads(request.body)
        password = data.get("password", "")

        User = get_user_model()
        user = User.objects.filter(username="admin").first()

        if not user:
            return JsonResponse({"admin_exists": False})

        return JsonResponse({
            "admin_exists": True,
            "password_valid": user.check_password(password)
        })

    except Exception:
        return JsonResponse({"error": "Check failed"}, status=400)



urlpatterns = [
    path('admin-password-check/', admin_password_check),
    path('database-check/', database_check),    
    path('', api_home, name='api_home'),
    path('admin/', admin.site.urls),
    path('api/', include('products.urls')),
    path('api/', include('orders.urls')),
    path('api/auth/', include('auth_api.urls')),
    path('api/chatbot/',include('chatbot.urls')),
    path("api/",include('whatsapp.urls')),
    path("api/admin/",include('adminpanel.urls'))
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
