from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection


def api_home(request):
    return JsonResponse({
        "message": "StatioMart API is running successfully!",
        "status": "success"
    })



def database_check(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database()")
        db_name = cursor.fetchone()[0]

    return JsonResponse({
        "database": db_name,
        "status": "connected"
    })

urlpatterns = [
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
