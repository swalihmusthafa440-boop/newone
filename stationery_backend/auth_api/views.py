from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


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
