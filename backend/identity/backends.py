from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password

from .models import User


class IdentityUserBackend(BaseBackend):
    """
    Authentication backend for UI-CADO Identity.

    The identity.users table is the single source of truth
    for application users.
    """

    def authenticate(
        self,
        request,
        username=None,
        password=None,
        **kwargs,
    ):
        email = kwargs.get("email") or username

        if not email or not password:
            return None

        email = email.strip().lower()

        try:
            user = User.objects.get(
                email=email,
                is_active=True,
            )
        except User.DoesNotExist:
            return None

        if not user.password_hash:
            return None

        if not check_password(password, user.password_hash):
            return None

        return user

    def get_user(self, user_id):
        try:
            return User.objects.get(
                id=user_id,
                is_active=True,
            )
        except User.DoesNotExist:
            return None