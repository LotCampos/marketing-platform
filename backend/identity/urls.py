from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import IdentityLoginView, IdentityUsersView


urlpatterns = [
    path(
        "users/",
        IdentityUsersView.as_view(),
        name="identity-users",
    ),
    path(
        "auth/login/",
        IdentityLoginView.as_view(),
        name="identity-login",
    ),
    path(
        "auth/refresh/",
        TokenRefreshView.as_view(),
        name="identity-token-refresh",
    ),
]
