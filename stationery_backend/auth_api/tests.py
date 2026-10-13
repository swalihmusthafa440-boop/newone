from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient


class AuthAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='johndoe',
            email='john@example.com',
            password='secretpassword123',
            first_name='John',
            last_name='Doe'
        )

    def test_login_with_username_case_insensitive(self):
        res = self.client.post('/api/auth/login/', {'username': 'JohnDoe', 'password': 'secretpassword123'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['username'], 'johndoe')

    def test_login_with_email(self):
        res = self.client.post('/api/auth/login/', {'username': 'john@example.com', 'password': 'secretpassword123'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)

    def test_login_invalid_password(self):
        res = self.client.post('/api/auth/login/', {'username': 'johndoe', 'password': 'wrongpassword'}, format='json')
        self.assertEqual(res.status_code, 401)

    def test_register_new_user(self):
        payload = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'strongpassword123',
            'first_name': 'New',
            'last_name': 'User'
        }
        res = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_register_duplicate_username_fails(self):
        payload = {
            'username': 'johndoe',
            'email': 'different@example.com',
            'password': 'strongpassword123'
        }
        res = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, 400)
