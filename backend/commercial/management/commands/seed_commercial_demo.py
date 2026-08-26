from uuid import uuid4

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from identity.models import User
from master.models import Client, Installation, ServiceCatalog
from commercial.models import ServiceRequest


class Command(BaseCommand):
    help = "Crea datos demo mínimos para probar el módulo Comercial de UI-CADO."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Iniciando carga demo Comercial UI-CADO...")

        user, user_created = User.objects.get_or_create(
            email="admin@ui-cado.local",
            defaults={
                "id": uuid4(),
                "employee_number": "UI-0001",
                "full_name": "Administrador UI-CADO",
                "system_role": "ADMIN",
                "is_active": True,
                "version_lock": 1,
            },
        )

        if not user_created:
            self.stdout.write(
                self.style.WARNING(
                    "Usuario demo ya existe: admin@ui-cado.local"
                )
            )

        client, client_created = Client.objects.get_or_create(
            rfc="XAXX010101000",
            defaults={
                "id": uuid4(),
                "business_name": "Cliente Demo UI-CADO",
                "is_deleted": False,
                "version_lock": 1,
            },
        )

        if not client_created:
            self.stdout.write(
                self.style.WARNING(
                    "Cliente demo ya existe: XAXX010101000"
                )
            )

        installation = Installation.objects.filter(
            client=client,
            cre_asea_permit="PERMISO-DEMO-001",
        ).first()

        if installation is None:
            installation = Installation.objects.create(
                id=uuid4(),
                client=client,
                address="Instalación Demo UI-CADO, Ciudad de México",
                gps_lat=None,
                gps_lng=None,
                cre_asea_permit="PERMISO-DEMO-001",
                is_deleted=False,
                version_lock=1,
            )
            installation_created = True
        else:
            installation_created = False
            self.stdout.write(
                self.style.WARNING(
                    "Instalación demo ya existe: PERMISO-DEMO-001"
                )
            )

        service, service_created = ServiceCatalog.objects.get_or_create(
            service_code="NOM-005-ASEA-2016",
            defaults={
                "id": uuid4(),
                "service_name": (
                    "Evaluación de la conformidad "
                    "NOM-005-ASEA-2016"
                ),
                "description": (
                    "Servicio demo para validar el flujo comercial "
                    "de UI-CADO."
                ),
                "regulatory_basis": "NOM-005-ASEA-2016",
                "is_active": True,
                "version_lock": 1,
            },
        )

        if not service_created:
            self.stdout.write(
                self.style.WARNING(
                    "Servicio demo ya existe: NOM-005-ASEA-2016"
                )
            )

        request = ServiceRequest.objects.filter(
            request_number="SOL-2026-000001"
        ).first()

        if request is None:
            request = ServiceRequest.objects.create(
                id=uuid4(),
                client_id=client.id,
                installation_id=installation.id,
                service_catalog_id=service.id,
                request_number="SOL-2026-000001",
                requested_at=timezone.now(),
                requested_by_name=user.full_name,
                requested_by_email=user.email,
                requested_by_phone="5555555555",
                request_description=(
                    "Primera solicitud comercial funcional "
                    "de prueba de UI-CADO."
                ),
                created_by=user.id,
                version_lock=1,
            )
            request_created = True
        else:
            request_created = False
            self.stdout.write(
                self.style.WARNING(
                    "Solicitud demo ya existe: SOL-2026-000001"
                )
            )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "=============================================="
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "DATOS DEMO COMERCIAL CREADOS CORRECTAMENTE"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "=============================================="
            )
        )
        self.stdout.write(f"USER          = {user.id}")
        self.stdout.write(f"USER CREATED  = {user_created}")
        self.stdout.write(f"CLIENT        = {client.id}")
        self.stdout.write(f"CLIENT CREATED= {client_created}")
        self.stdout.write(f"INSTALLATION  = {installation.id}")
        self.stdout.write(f"INSTALL CREATED= {installation_created}")
        self.stdout.write(f"SERVICE       = {service.id}")
        self.stdout.write(f"SERVICE CREATED= {service_created}")
        self.stdout.write(f"REQUEST       = {request.id}")
        self.stdout.write(f"REQUEST CREATED= {request_created}")
        self.stdout.write(f"REQUEST NO.   = {request.request_number}")
        self.stdout.write(
            self.style.SUCCESS(
                "=============================================="
            )
        )