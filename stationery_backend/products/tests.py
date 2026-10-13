from django.test import TestCase
from django.contrib.auth.models import User
from products.models import Product, Category, Review
from rest_framework.test import APIClient
from decimal import Decimal


class ProductAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='cust1', password='password123')
        self.admin = User.objects.create_superuser(username='admin', password='adminpassword', email='admin@test.com')
        self.category = Category.objects.create(name='Art', slug='art')
        self.active_prod = Product.objects.create(
            name='Acrylic Paint Set',
            category=self.category,
            price=Decimal('350.00'),
            stock=10,
            is_active=True
        )
        self.inactive_prod = Product.objects.create(
            name='Hidden Brush Set',
            category=self.category,
            price=Decimal('150.00'),
            stock=5,
            is_active=False
        )

    def test_anonymous_user_only_sees_active_products(self):
        res = self.client.get('/api/products/')
        self.assertEqual(res.status_code, 200)
        results = res.data.get('results', res.data)
        names = [p['name'] for p in results]
        self.assertIn('Acrylic Paint Set', names)
        self.assertNotIn('Hidden Brush Set', names)

    def test_admin_sees_all_products(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/products/')
        self.assertEqual(res.status_code, 200)
        results = res.data.get('results', res.data)
        names = [p['name'] for p in results]
        self.assertIn('Acrylic Paint Set', names)
        self.assertIn('Hidden Brush Set', names)

    def test_submit_and_update_review(self):
        self.client.force_authenticate(user=self.user)
        # Create review
        res = self.client.post(f'/api/products/{self.active_prod.id}/reviews/', {
            'rating': 4,
            'comment': 'Great colours!'
        }, format='json')
        self.assertEqual(res.status_code, 201)

        # Update existing review (must not raise 500 integrity error)
        res2 = self.client.post(f'/api/products/{self.active_prod.id}/reviews/', {
            'rating': 5,
            'comment': 'Updated: Excellent colours!'
        }, format='json')
        self.assertEqual(res2.status_code, 201)
        self.assertEqual(Review.objects.filter(product=self.active_prod, user=self.user).count(), 1)
