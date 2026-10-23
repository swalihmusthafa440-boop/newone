from django.urls import path
from .reports import CategorySalesReportAPIView

urlpatterns = [
    # Keep your existing URL patterns.
    path(
        "reports/category-sales/",
        CategorySalesReportAPIView.as_view(),
        name="category-sales-report",
    ),
]