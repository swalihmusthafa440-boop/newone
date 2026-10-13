from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.exceptions import ValidationError
from .models import Product, Category, Review
from .serializers import ProductSerializer, CategorySerializer, ReviewSerializer


class ProductListView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['name', 'price', 'created_at', 'stock']
    ordering = ['name']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def get_queryset(self):
        # Admin / staff can see all products including inactive; regular shoppers see active only
        if self.request.user.is_authenticated and self.request.user.is_staff:
            queryset = Product.objects.all().select_related('category').prefetch_related('reviews')
        else:
            queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related('reviews')

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        return queryset


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related('category').prefetch_related('reviews')
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [IsAdminUser()]
        return [AllowAny()]


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        return Review.objects.filter(
            product_id=self.kwargs['product_pk']
        ).select_related('user')

    def perform_create(self, serializer):
        try:
            product = Product.objects.get(pk=self.kwargs['product_pk'])
        except Product.DoesNotExist:
            raise ValidationError('Product not found.')

        existing_review = Review.objects.filter(product=product, user=self.request.user).first()
        if existing_review:
            existing_review.rating = serializer.validated_data.get('rating', existing_review.rating)
            existing_review.comment = serializer.validated_data.get('comment', existing_review.comment)
            existing_review.save()
            serializer.instance = existing_review
        else:
            serializer.save(user=self.request.user, product=product)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    from orders.models import Order
    from django.contrib.auth.models import User
    from django.db.models import Sum, Count

    total_orders = Order.objects.count()
    total_revenue = Order.objects.aggregate(total=Sum('total_amount'))['total'] or 0
    total_products = Product.objects.count()
    total_users = User.objects.filter(is_staff=False).count()
    pending_orders = Order.objects.filter(status='pending').count()
    delivered_orders = Order.objects.filter(status='delivered').count()
    out_of_stock = Product.objects.filter(stock=0).count()

    status_breakdown = list(
        Order.objects.values('status').annotate(count=Count('id'), revenue=Sum('total_amount'))
    )

    return Response({
        'total_orders': total_orders,
        'total_revenue': float(total_revenue),
        'total_products': total_products,
        'total_users': total_users,
        'pending_orders': pending_orders,
        'delivered_orders': delivered_orders,
        'out_of_stock': out_of_stock,
        'status_breakdown': status_breakdown,
    })
