from __future__ import annotations

from enum import StrEnum


class SystemRole(StrEnum):

    ADMIN = "ADMIN"
    MARKETING = "MARKETING"
    EJECUTIVO_COMERCIAL = "EJECUTIVO_COMERCIAL"
    LOGISTICA = "LOGISTICA"
    INSPECTOR = "INSPECTOR"
    CALIDAD = "CALIDAD"
    DIRECCION = "DIRECCION"


SYSTEM_ROLES = tuple(role.value for role in SystemRole)
