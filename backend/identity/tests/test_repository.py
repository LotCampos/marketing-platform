from uuid import uuid4

from django.test import TestCase

from core.exceptions import ConcurrencyError
from identity.models import User
from identity.repositories import UserRepository


class UserRepositoryTests(TestCase):
    def setUp(self):
        self.repository = UserRepository()

    def test_get_by_id_returns_existing_user(self):
        user = User.objects.create(
            email=f"test-{uuid4()}@example.com",
            employee_number=f"EMP-{uuid4()}",
            full_name="Test User",
            system_role="TEST",
            is_active=True,
            version_lock=1,
        )

        result = self.repository.get_by_id(user.id)

        self.assertIsNotNone(result)
        self.assertEqual(result.id, user.id)

    def test_update_increments_version_lock(self):
        user = User.objects.create(
            email=f"test-{uuid4()}@example.com",
            employee_number=f"EMP-{uuid4()}",
            full_name="Test User",
            system_role="TEST",
            is_active=True,
            version_lock=1,
        )

        user.full_name = "Updated User"

        result = self.repository.update(user)

        self.assertEqual(result.version_lock, 2)

        refreshed = User.objects.get(pk=user.id)

        self.assertEqual(refreshed.full_name, "Updated User")
        self.assertEqual(refreshed.version_lock, 2)

    def test_update_rejects_stale_version(self):
        user = User.objects.create(
            email=f"test-{uuid4()}@example.com",
            employee_number=f"EMP-{uuid4()}",
            full_name="Test User",
            system_role="TEST",
            is_active=True,
            version_lock=1,
        )

        user.version_lock = 0

        with self.assertRaises(ConcurrencyError):
            self.repository.update(user)