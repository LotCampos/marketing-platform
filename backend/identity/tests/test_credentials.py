from uuid import uuid4

from django.contrib.auth.hashers import check_password
from django.test import TestCase

from core.exceptions import ValidationError
from identity.credential_service import CredentialService
from identity.dtos import SetPasswordDTO
from identity.models import User


class CredentialServiceTests(TestCase):

    def setUp(self):
        self.service = CredentialService()

        self.user = User.objects.create(
            email=f"credential-{uuid4()}@example.com",
            employee_number=f"EMP-{uuid4()}",
            full_name="Credential Test User",
            system_role="TEST",
            is_active=True,
            version_lock=1,
            password_hash=None,
        )

    def test_set_password_stores_hash(self):
        self.service.set_password(
            SetPasswordDTO(
                user_id=self.user.id,
                password="StrongTestPassword!2026",
                expected_version=1,
            )
        )

        refreshed = User.objects.get(
            pk=self.user.id
        )

        self.assertIsNotNone(
            refreshed.password_hash
        )

        self.assertNotEqual(
            refreshed.password_hash,
            "StrongTestPassword!2026",
        )

        self.assertTrue(
            check_password(
                "StrongTestPassword!2026",
                refreshed.password_hash,
            )
        )

        self.assertEqual(
            refreshed.version_lock,
            2,
        )

    def test_set_password_rejects_empty_password(self):
        with self.assertRaises(ValidationError):
            self.service.set_password(
                SetPasswordDTO(
                    user_id=self.user.id,
                    password="",
                    expected_version=1,
                )
            )

    def test_set_password_rejects_stale_version(self):
        with self.assertRaises(Exception):
            self.service.set_password(
                SetPasswordDTO(
                    user_id=self.user.id,
                    password="StrongTestPassword!2026",
                    expected_version=0,
                )
            )