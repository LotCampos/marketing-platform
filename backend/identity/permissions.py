from __future__ import annotations

from enum import StrEnum

from rest_framework.permissions import BasePermission

from .roles import SystemRole


class Permission(StrEnum):
    VIEW = "VIEW"
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    APPROVE = "APPROVE"
    ASSIGN = "ASSIGN"
    ISSUE = "ISSUE"
    DOWNLOAD = "DOWNLOAD"
    EXECUTE = "EXECUTE"
    REVIEW = "REVIEW"
    ADMIN = "ADMIN"


ROLE_PERMISSIONS: dict[SystemRole, frozenset[Permission]] = {
    SystemRole.ADMIN: frozenset(Permission),
    SystemRole.MARKETING: frozenset(Permission),

    SystemRole.EJECUTIVO_COMERCIAL: frozenset({
        Permission.VIEW,
        Permission.CREATE,
        Permission.UPDATE,
        Permission.DOWNLOAD,
    }),

    SystemRole.LOGISTICA: frozenset({
        Permission.VIEW,
        Permission.ASSIGN,
        Permission.EXECUTE,
    }),

    SystemRole.INSPECTOR: frozenset({
        Permission.VIEW,
        Permission.EXECUTE,
        Permission.REVIEW,
    }),

    SystemRole.CALIDAD: frozenset({
        Permission.VIEW,
        Permission.REVIEW,
        Permission.APPROVE,
        Permission.DOWNLOAD,
    }),

    SystemRole.DIRECCION: frozenset({
        Permission.VIEW,
        Permission.REVIEW,
        Permission.APPROVE,
        Permission.DOWNLOAD,
    }),
}


class HasSystemRole(BasePermission):
    allowed_roles: tuple[SystemRole, ...] = ()

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        role = SystemRole(user.system_role)

        if role == SystemRole.MARKETING:
            return True

        return role in self.allowed_roles


class HasPermission(BasePermission):
    required_permission: Permission | None = None

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        role = SystemRole(user.system_role)

        if role == SystemRole.MARKETING:
            return True

        permission = self.required_permission

        if permission is None:
            return False

        return permission in ROLE_PERMISSIONS.get(
            role,
            frozenset(),
        )


class IsCommercialUser(HasSystemRole):
    allowed_roles = (
        SystemRole.EJECUTIVO_COMERCIAL,
    )


class CanView(HasPermission):
    required_permission = Permission.VIEW


class CanCreate(HasPermission):
    required_permission = Permission.CREATE


class CanUpdate(HasPermission):
    required_permission = Permission.UPDATE


class CanDelete(HasPermission):
    required_permission = Permission.DELETE


class CanApprove(HasPermission):
    required_permission = Permission.APPROVE


class CanAssign(HasPermission):
    required_permission = Permission.ASSIGN


class CanIssue(HasPermission):
    required_permission = Permission.ISSUE


class CanDownload(HasPermission):
    required_permission = Permission.DOWNLOAD


class CanExecute(HasPermission):
    required_permission = Permission.EXECUTE


class CanReview(HasPermission):
    required_permission = Permission.REVIEW


class IsAdmin(HasPermission):
    required_permission = Permission.ADMIN
