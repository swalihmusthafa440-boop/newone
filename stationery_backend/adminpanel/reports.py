from datetime import date
from decimal import Decimal

from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from django.utils.dateparse import parse_date

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from products.models import Category, Product
from orders.models import Order, OrderItem


class CategorySalesReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from_date = parse_date(
            request.query_params.get("from_date", "")
        )
        to_date = parse_date(
            request.query_params.get("to_date", "")
        )
        category_id = request.query_params.get("category", "all")

        if not from_date or not to_date:
            return Response(
                {"error": "From Date and To Date are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if from_date > to_date:
            return Response(
                {"error": "From Date must be before To Date."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Each shop owner can see only their own store's reports.
        store_ids = list(
            request.user.owned_stores.values_list("id", flat=True)
        )

        if not store_ids:
            return Response(
                {"error": "No store is linked to this account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        categories = Category.objects.filter(
            products__store_id__in=store_ids
        ).distinct().order_by("name")

        if category_id != "all":
            try:
                category_id = int(category_id)
            except (TypeError, ValueError):
                return Response(
                    {"error": "Invalid category."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            categories = categories.filter(id=category_id)

        sales_value = ExpressionWrapper(
            F("quantity") * F("unit_price"),
            output_field=DecimalField(
                max_digits=14, decimal_places=2
            ),
        )

        expense_value = ExpressionWrapper(
            F("quantity") * F("product__cost_price"),
            output_field=DecimalField(
                max_digits=14, decimal_places=2
            ),
        )

        items = OrderItem.objects.filter(
            order__store_id__in=store_ids,
            order__created_at__date__gte=from_date,
            order__created_at__date__lte=to_date,
        ).exclude(
            order__status="cancelled"
        )

        grouped = (
            items.values("product__category_id")
            .annotate(
                items_sold=Sum("quantity"),
                sales=Sum(sales_value),
                expense=Sum(expense_value),
            )
        )

        grouped_by_category = {
            row["product__category_id"]: row
            for row in grouped
        }

        report = []
        total_items = 0
        total_sales = Decimal("0.00")
        total_expense = Decimal("0.00")

        for category in categories:
            row = grouped_by_category.get(category.id, {})

            quantity = row.get("items_sold") or 0
            sales = row.get("sales") or Decimal("0.00")
            expense = row.get("expense") or Decimal("0.00")
            profit = sales - expense

            report.append({
                "category_id": category.id,
                "category": category.name,
                "items_sold": quantity,
                "sales": str(sales),
                "expense": str(expense),
                "gross_profit": str(profit),
            })

            total_items += quantity
            total_sales += sales
            total_expense += expense

        return Response({
            "from_date": from_date.isoformat(),
            "to_date": to_date.isoformat(),
            "categories": [
                {"id": c.id, "name": c.name}
                for c in Category.objects.filter(
                    products__store_id__in=store_ids
                ).distinct().order_by("name")
            ],
            "summary": {
                "items_sold": total_items,
                "sales": str(total_sales),
                "expense": str(total_expense),
                "gross_profit": str(
                    total_sales - total_expense
                ),
            },
            "report": report,
        })