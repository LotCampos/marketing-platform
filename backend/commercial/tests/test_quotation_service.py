from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from commercial.services.quotation_service import (
    QuotationCreateData,
    QuotationItemCreateData,
    QuotationService,
)


class QuotationServiceConsistencyTests(SimpleTestCase):
    def setUp(self):
        self.opportunity_id = uuid4()
        self.client_id = uuid4()
        self.item = QuotationItemCreateData(
            service_catalog_id=uuid4(),
            description="Inspección normativa",
            quantity=Decimal("1"),
            unit_price=Decimal("1000.00"),
        )

    def _data(self, client_id=None):
        return QuotationCreateData(
            quotation_number="COT-TEST-0001",
            opportunity_id=self.opportunity_id,
            client_id=client_id or self.client_id,
            issued_by=uuid4(),
            items=(self.item,),
        )

    @patch("commercial.services.quotation_service.Opportunity")
    def test_rejects_quotation_when_opportunity_has_no_client(self, opportunity_model):
        opportunity_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            id=self.opportunity_id,
            client_id=None,
        )

        with self.assertRaises(ValidationError) as context:
            QuotationService(
                repository=MagicMock(),
                item_repository=MagicMock(),
            ).create(self._data())

        self.assertIn("opportunity_id", context.exception.message_dict)

    @patch("commercial.services.quotation_service.Opportunity")
    def test_rejects_client_mismatch_with_opportunity(self, opportunity_model):
        opportunity_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            id=self.opportunity_id,
            client_id=uuid4(),
        )

        with self.assertRaises(ValidationError) as context:
            QuotationService(
                repository=MagicMock(),
                item_repository=MagicMock(),
            ).create(self._data())

        self.assertIn("client_id", context.exception.message_dict)

    @patch("commercial.services.quotation_service.Opportunity")
    @patch("commercial.services.quotation_service.Quotation")
    def test_accepts_matching_opportunity_client(self, quotation_model, opportunity_model):
        opportunity_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            id=self.opportunity_id,
            client_id=self.client_id,
        )
        quotation_model.objects.filter.return_value.exists.return_value = False

        repository = MagicMock()
        quotation = SimpleNamespace(id=uuid4())
        repository.add.return_value = quotation
        item_repository = MagicMock()

        result = QuotationService(
            repository=repository,
            item_repository=item_repository,
        ).create(self._data())

        self.assertEqual(result, quotation)
        repository.add.assert_called_once()
        item_repository.add.assert_called_once()
