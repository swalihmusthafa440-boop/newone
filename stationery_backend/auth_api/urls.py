from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views


urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('profile/', views.profile_view, name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('google/', views.google_login_view, name='google_login'),
    path('users/', views.manage_user_roles, name='manage_users'),
    path(
        'users/<int:user_id>/role/',
        views.manage_user_roles,
        name='manage_user_role'
    ),
]
