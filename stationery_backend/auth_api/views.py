from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.db import transaction
from .models import UserRole

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def user_data(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
    }
@api_view(['POST'])
@permission_classes([AllowAny])
def google_login_view(request):
    credential = request.data.get('credential')

    if not credential:
        return Response(
            {'detail': 'Google credential is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Verify the ID token with Google
        google_user = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        if google_user.get('iss') not in (
            'accounts.google.com',
            'https://accounts.google.com'
        ):
            return Response(
                {'detail': 'Invalid Google token issuer.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not google_user.get('email_verified'):
            return Response(
                {'detail': 'Please use a verified Google email.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        google_id = google_user.get('sub')
        email = google_user.get('email', '').lower().strip()

        if not google_id or not email:
            return Response(
                {'detail': 'Google account details are incomplete.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use Google's stable ID to identify returning users.
        username = f'google_{google_id}'

        with transaction.atomic():
            user = User.objects.filter(username=username).first()

            if user is None:
                # Do not silently connect an existing account by email.
                if User.objects.filter(email__iexact=email).exists():
                    return Response(
                        {
                            'detail': (
                                'An account already uses this email. '
                                'Please contact the administrator to link it.'
                            )
                        },
                        status=status.HTTP_409_CONFLICT
                    )

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=google_user.get('given_name', ''),
                    last_name=google_user.get('family_name', ''),
                )

        tokens = get_tokens_for_user(user)

        return Response({
            **tokens,
            'user': user_data(user),
        })

    except ValueError:
        return Response(
            {'detail': 'Google sign-in verification failed.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username_or_email = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username_or_email or not password:
        return Response({'detail': 'Username/email and password are required.'}, status=400)

    # First attempt direct authentication
    user = authenticate(username=username_or_email, password=password)

    # If direct authentication failed, lookup case-insensitively by username or email
    if not user:
        user_match = (
            User.objects.filter(username__iexact=username_or_email).first() or
            User.objects.filter(email__iexact=username_or_email).first()
        )
        if user_match:
            user = authenticate(username=user_match.username, password=password)

    if not user:
        return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    tokens = get_tokens_for_user(user)
    return Response({**tokens, 'user': user_data(user)})


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()

    if not username or not password:
        return Response({'detail': 'Username and password are required.'}, status=400)
    if len(password) < 6:
        return Response({'detail': 'Password must be at least 6 characters.'}, status=400)

    if email:
        try:
            validate_email(email)
        except ValidationError:
            return Response({'email': ['Enter a valid email address.']}, status=400)

    if User.objects.filter(username__iexact=username).exists():
        return Response({'username': ['A user with this username already exists.']}, status=400)
    if email and User.objects.filter(email__iexact=email).exists():
        return Response({'email': ['A user with this email already exists.']}, status=400)

    user = User.objects.create_user(
        username=username, email=email, password=password,
        first_name=first_name, last_name=last_name,
    )
    tokens = get_tokens_for_user(user)
    return Response({**tokens, 'user': user_data(user)}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    if request.method == 'GET':
        return Response(user_data(user))
    # PATCH - update profile
    user.first_name = request.data.get('first_name', user.first_name)
    user.last_name = request.data.get('last_name', user.last_name)
    new_email = request.data.get('email', user.email)
    if new_email and new_email != user.email:
        if User.objects.filter(email__iexact=new_email).exclude(id=user.id).exists():
            return Response({'email': ['A user with this email already exists.']}, status=400)
        user.email = new_email
    user.save()
    return Response(user_data(user))


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def manage_user_roles(request, user_id=None):
    if not request.user.is_superuser:
        return Response(
            {'detail': 'Only the superuser can manage user roles.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        users = User.objects.all().order_by('id')
        data = []

        for user in users:
            role_info, _ = UserRole.objects.get_or_create(user=user)
            data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': role_info.role,
                'is_superuser': user.is_superuser,
            })

        return Response(data)

    if user_id is None:
        return Response(
            {'detail': 'User ID is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'detail': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if target_user.is_superuser:
        return Response(
            {'detail': 'Superuser role cannot be changed here.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    role = request.data.get('role')
    allowed_roles = ['customer', 'shop_owner', 'admin']

    if role not in allowed_roles:
        return Response(
            {'detail': 'Invalid role.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    role_info, _ = UserRole.objects.get_or_create(user=target_user)
    role_info.role = role
    role_info.save()

    return Response({
        'detail': 'User role updated successfully.',
        'user_id': target_user.id,
        'role': role_info.role,
    })
