from django.urls import path
from . import views




urlpatterns = [
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:product_pk>/reviews/', views.ReviewListCreateView.as_view(), name='product-reviews'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('admin-stats/', views.admin_stats, name='admin-stats'),
]
