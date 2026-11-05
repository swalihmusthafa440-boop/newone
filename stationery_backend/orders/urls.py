from django.urls import path
from . import views
from . import credit_views

urlpatterns = [
    # Existing routes
    path('addresses/', views.AddressListCreateView.as_view(), name='address-list'),
    path('addresses/<int:pk>/', views.AddressDetailView.as_view(), name='address-detail'),
    path('orders/', views.OrderListCreateView.as_view(), name='order-list'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('coupons/validate/', views.validate_coupon, name='coupon-validate'),

    # Delivery cash handover
    path(
        'orders/<int:order_id>/delivery-handover/',
        credit_views.DeliveryCashHandoverView.as_view(),
        name='delivery-handover',
    ),

    # Admin credit management
    path('credits/', credit_views.AdminCreditsView.as_view(), name='admin-credits'),
    path('credits/<int:credit_id>/', credit_views.AdminCreditDetailView.as_view(), name='admin-credit-detail'),
    path('credits/<int:credit_id>/payments/', credit_views.RecordCreditPaymentView.as_view(), name='record-credit-payment'),

    # Customer credit page
    path('my-credits/', credit_views.MyCreditsView.as_view(), name='my-credits'),
    path('notifications/',views.NotificationListView.as_view(),name='notifications'),
    path('notifications/<int:pk>/read/',views.NotificationReadView.as_view(),name='notification-read'),
    path('push/subscribe/',views.PushSubscriptionView.as_view(),name='push-subscribe'),
    path('delivery-charge/preview/',views.delivery_charge_preview,name='delivery-charge-preview'),
]