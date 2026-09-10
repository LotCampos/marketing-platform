from decimal import Decimal
from unittest.mock import Mock, patch
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from commercial.services.opportunity_service import (
    OpportunityCreateData,
    OpportunityService,
)


class OpportunityServiceTests(SimpleTestCase):
    def _data(self, **overrides):
        data = {
            "opportunity_number": "OPP-TEST-001",
            "title": "Servicio de prueba",
            "prospect_id": None,
            "service_request_id": None,
            "client_id": None,
            "assigned_to": None,
            "description": None,
            "estimated_value": Decimal("1000.00"),
        }
        data.update(overrides)
        return OpportunityCreateData(**data)

    @patch("commercial.services.opportunity_service.Opportunity.objects")
    def test_create_requires_at_least_one_origin(self, objects):
        with self.assertRaises(ValidationError) as ctx:
            OpportunityService(repository=Mock()).create(self._data())

        self.assertIn("origin", ctx.exception.message_dict)
        objects.filter.assert_not_called()

    @patch("commercial.services.opportunity_service.Opportunity.objects")
    def test_create_accepts_client_origin(self, objects):
        objects.filter.return_value.exists.return_value = False
        repository = Mock()
        repository.add.side_effect = lambda opportunity: opportunity

        result = OpportunityService(repository=repository).create(
            self._data(client_id=uuid4())
        )

        self.assertEqual(result.client_id, self._data(client_id=result.client_id).client_id)
        repository.add.assert_called_once()

    @patch("commercial.services.opportunity_service.Opportunity.objects")
    def test_create_accepts_service_request_origin(self, objects):
        objects.filter.return_value.exists.return_value = False
        repository = Mock()
        repository.add.side_effect = lambda opportunity: opportunity

        service_request_id = uuid4()
        result = OpportunityService(repository=repository).create(
            self._data(service_request_id=service_request_id)
        )

        self.assertEqual(result.service_request_id, service_request_id)
        repository.add.assert_called_once()