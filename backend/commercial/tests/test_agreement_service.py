from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from commercial.services.agreement_service import AgreementCreateData, AgreementService


class AgreementServiceTests(SimpleTestCase):
    def setUp(self):
        self.quotation_id = uuid4()
        self.opportunity_id = uuid4()
        self.client_id = uuid4()

    def _data(self):
        return AgreementCreateData(
            agreement_number="AGR-TEST-0001",
            quotation_id=self.quotation_id,
            opportunity_id=self.opportunity_id,
            client_id=self.client_id,
        )

    @patch("commercial.services.agreement_service.Quotation")
    def test_rejects_quotation_without_client(self, quotation_model):
        quotation_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            client_id=None,
            opportunity_id=self.opportunity_id,
        )

        with self.assertRaises(ValidationError) as context:
            AgreementService.create(self._data())

        self.assertIn("quotation_id", context.exception.message_dict)

    @patch("commercial.services.agreement_service.Quotation")
    def test_rejects_opportunity_mismatch(self, quotation_model):
        quotation_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            client_id=self.client_id,
            opportunity_id=uuid4(),
        )

        with self.assertRaises(ValidationError) as context:
            AgreementService.create(self._data())

        self.assertIn("opportunity_id", context.exception.message_dict)

    @patch("commercial.services.agreement_service.Agreement")
    @patch("commercial.services.agreement_service.Opportunity")
    @patch("commercial.services.agreement_service.Quotation")
    def test_creates_consistent_agreement(self, quotation_model, opportunity_model, agreement_model):
        quotation_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            client_id=self.client_id,
            opportunity_id=self.opportunity_id,
        )
        opportunity_model.objects.select_for_update.return_value.get.return_value = SimpleNamespace(
            client_id=self.client_id,
        )
        agreement_model.objects.filter.return_value.exists.return_value = False
        agreement = SimpleNamespace(id=uuid4())
        agreement_model.objects.create.return_value = agreement

        result = AgreementService.create(self._data())

        self.assertEqual(result, agreement)
        agreement_model.objects.create.assert_called_once()