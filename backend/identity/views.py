from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken


class IdentityLoginView(APIView):
    """
    Identity authentication endpoint.

    POST /api/identity/auth/login/
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not isinstance(email, str) or not email.strip():
            return Response(
                {
                    "detail": "Email is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(password, str) or not password:
            return Response(
                {
                    "detail": "Password is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(
            request=request,
            email=email,
            password=password,
        )

        if user is None:
            return Response(
                {
                    "detail": "Invalid credentials.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "employee_number": user.employee_number,
                    "full_name": user.full_name,
                    "system_role": user.system_role,
                    "is_active": user.is_active,
                    "version_lock": user.version_lock,
                },
            },
            status=status.HTTP_200_OK,
        )

class IdentityUsersView(APIView):
    """
    Returns active users available for commercial assignment.

    GET /api/identity/users/
    """

    def get(self, request):
        from .models import User

        users = (
            User.objects
            .filter(is_active=True)
            .order_by("full_name")
        )

        return Response(
            {
                "count": users.count(),
                "results": [
                    {
                        "id": str(user.id),
                        "full_name": user.full_name,
                        "email": user.email,
                        "employee_number": user.employee_number,
                        "system_role": user.system_role,
                    }
                    for user in users
                ],
            },
            status=status.HTTP_200_OK,
        )
