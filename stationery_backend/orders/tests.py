from django.test import TestCase
from django.contrib.auth.models import User
from products.models import Product, Category
from orders.models import Order, OrderItem, Address, Coupon
from rest_framework.test import APIClient
from decimal import Decimal


class OrderAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='customer1', password='pass1234password')
        self.other_user = User.objects.create_user(username='customer2', password='pass1234password')
        self.admin = User.objects.create_superuser(username='adminuser', password='adminpassword', email='admin@test.com')
        self.category = Category.objects.create(name='Notebooks', slug='notebooks')
        self.product = Product.objects.create(
            name='Spiral Notebook A5',
            category=self.category,
            price=Decimal('100.00'),
            stock=15,
            is_active=True
        )
        self.coupon = Coupon.objects.create(
            code='SAVE10',
            discount_type='percent',
            discount_value=Decimal('10.00'),
            min_order_amount=Decimal('50.00'),
            is_active=True
        )

    def test_create_order_authenticated_and_stock_deduction(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'payment_method': 'cod',
            'coupon_code': 'SAVE10',
            'address_data': {
                'name': 'Customer One',
                'phone': '9876543210',
                'address_line1': 'Flat 401, Skyline Apartments',
                'city': 'Bengaluru',
                'state': 'Karnataka',
                'pincode': '560001',
                'is_saved': True
            },
            'items': [
                {'product_id': self.product.id, 'quantity': 2}
            ]
        }
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['status'], 'pending')
        # Subtotal: 2 * 100 = 200, 10% coupon = 20, Total = 180.00
        self.assertEqual(Decimal(str(res.data['total_amount'])), Decimal('180.00'))
        self.assertEqual(Decimal(str(res.data['discount_amount'])), Decimal('20.00'))
        self.assertEqual(res.data['items'][0]['product_name'], 'Spiral Notebook A5')

        # Verify stock was deducted
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 13)

        # Verify coupon usage was incremented
        self.coupon.refresh_from_db()
        self.assertEqual(self.coupon.uses, 1)

    def test_stock_validation_insufficient_stock(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'payment_method': 'cod',
            'address_data': {
                'name': 'Customer One',
                'phone': '9876543210',
                'address_line1': '123 Main Road',
                'city': 'Kochi',
                'state': 'Kerala',
                'pincode': '682001',
            },
            'items': [
                {'product_id': self.product.id, 'quantity': 99} # Exceeds stock (15)
            ]
        }
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('items', res.data)

    def test_customer_privacy_cannot_view_others_order(self):
        addr = Address.objects.create(user=self.user, name='Cust1', phone='9876543210', address_line1='A', city='B', state='C', pincode='123456')
        order = Order.objects.create(user=self.user, address=addr, total_amount=Decimal('100.00'), status='pending')

        # Customer 2 tries to view Customer 1's order
        self.client.force_authenticate(user=self.other_user)
        res = self.client.get(f'/api/orders/{order.id}/')
        self.assertEqual(res.status_code, 403)

        # Customer 1 can view their own order
        self.client.force_authenticate(user=self.user)
        res2 = self.client.get(f'/api/orders/{order.id}/')
        self.assertEqual(res2.status_code, 200)

        # Admin can view the order
        self.client.force_authenticate(user=self.admin)
        res3 = self.client.get(f'/api/orders/{order.id}/')
        self.assertEqual(res3.status_code, 200)

    def test_validate_coupon_endpoint(self):
        res = self.client.post('/api/coupons/validate/', {'code': 'SAVE10', 'order_amount': 100}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['code'], 'SAVE10')

        # Test below min order amount
        res2 = self.client.post('/api/coupons/validate/', {'code': 'SAVE10', 'order_amount': 20}, format='json')
        self.assertEqual(res2.status_code, 400)

    def test_customer_can_cancel_pending_order(self):
        self.client.force_authenticate(user=self.user)
        addr = Address.objects.create(user=self.user, name='Cust', phone='9876543210', address_line1='A', city='B', state='C', pincode='123456')
        order = Order.objects.create(user=self.user, address=addr, total_amount=Decimal('100.00'), status='pending')

        res = self.client.patch(f'/api/orders/{order.id}/', {'status': 'cancelled'}, format='json')
        self.assertEqual(res.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, 'cancelled')
