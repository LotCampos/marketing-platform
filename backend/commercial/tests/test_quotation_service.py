from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from commercial.models import ProspectStatus
from commercial.services.quotation_service import (
    QuotationCreateData,
    QuotationItemCreateData,
    QuotationService,
)


class QuotationServiceConsistencyTests(SimpleTestCase):
    def setUp(self):
        self.opportunity_id = uuid4()
        self.client_id = uuid4()
        self.prospect_id = uuid4()
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
            client_id=client_id,
            issued_by=uuid4(),
            items=(self.item,),
        )

    @patch("commercial.services.quotation_service.Prospect")
    @patch("commercial.services.quotation_service.Opportunity")
    @patch("commercial.services.quotation_service.Quotation")
    def test_allows_quotation_for_prospect_opportunity_without_client(self, quotation_model, opportunity_model, prospect_model):
        opportunity_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            id=self.opportunity_id, client_id=None, prospect_id=self.prospect_id
        )
        prospect_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            id=self.prospect_id, status=ProspectStatus.QUOTED, version_lock=1
        )
        quotation_model.objects.filter.return_value.exists.return_value = False
        repository = MagicMock()
        quotation = SimpleNamespace(id=uuid4(), client_id=None)
        repository.add.return_value = quotation

        result = QuotationService(repository=repository, item_repository=MagicMock()).create(self._data())

        self.assertEqual(result, quotation)
        self.assertIsNone(repository.add.call_args.args[0].client_id)

    @patch("commercial.services.quotation_service.Opportunity")
    def test_rejects_client_on_unconverted_prospect_opportunity(self, opportunity_model):
        opportunity_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            id=self.opportunity_id, client_id=None, prospect_id=None
        )

        with self.assertRaises(ValidationError) as context:
            QuotationService(repository=MagicMock(), item_repository=MagicMock()).create(self._data(self.client_id))

        self.assertIn("client_id", context.exception.message_dict)

    @patch("commercial.services.quotation_service.Opportunity")
    def test_rejects_client_mismatch_with_opportunity(self, opportunity_model):
        opportunity_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            id=self.opportunity_id, client_id=uuid4(), prospect_id=None
        )

        with self.assertRaises(ValidationError) as context:
            QuotationService(repository=MagicMock(), item_repository=MagicMock()).create(self._data(self.client_id))

        self.assertIn("client_id", context.exception.message_dict)

    @patch("commercial.services.quotation_service.Opportunity")
    @patch("commercial.services.quotation_service.Quotation")
    def test_inherits_client_from_opportunity(self, quotation_model, opportunity_model):
        opportunity_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            id=self.opportunity_id, client_id=self.client_id, prospect_id=None
        )
        quotation_model.objects.filter.return_value.exists.return_value = False
        repository = MagicMock()
        quotation = SimpleNamespace(id=uuid4(), client_id=self.client_id)
        repository.add.return_value = quotation

        result = QuotationService(repository=repository, item_repository=MagicMock()).create(self._data())

        self.assertEqual(result, quotation)
        self.assertEqual(repository.add.call_args.args[0].client_id, self.client_id)

    @patch("commercial.services.quotation_service.Prospect")
    @patch("commercial.services.quotation_service.Opportunity")
    @patch("commercial.services.quotation_service.Quotation")
    def test_advances_qualified_prospect_to_quoted(self, quotation_model, opportunity_model, prospect_model):
        opportunity_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            id=self.opportunity_id, client_id=None, prospect_id=self.prospect_id
        )
        prospect_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            id=self.prospect_id, status=ProspectStatus.QUALIFIED, version_lock=4
        )
        quotation_model.objects.filter.return_value.exists.return_value = False
        repository = MagicMock()
        repository.add.return_value = SimpleNamespace(id=uuid4(), client_id=None)

        QuotationService(repository=repository, item_repository=MagicMock()).create(self._data())

        prospect_model.objects.filter.assert_called_once_with(id=self.prospect_id, version_lock=4)
        prospect_model.objects.filter.return_value.update.assert_called_once_with(
            status=ProspectStatus.QUOTED,
            version_lock=prospect_model.objects.filter.return_value.update.call_args.kwargs["version_lock"],
        )