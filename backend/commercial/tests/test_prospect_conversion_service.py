from unittest.mock import patch
from uuid import uuid4

from django.test import SimpleTestCase
from django.core.exceptions import ValidationError

from commercial.models import ProspectStatus
from commercial.services.prospect_conversion_service import ProspectConversionService


class ProspectConversionServiceTests(SimpleTestCase):
    @patch("commercial.services.prospect_conversion_service.Quotation.objects")
    @patch("commercial.services.prospect_conversion_service.Opportunity.objects")
    @patch("commercial.services.prospect_conversion_service.ClientService.create_from_prospect")
    @patch("commercial.services.prospect_conversion_service.Prospect.objects")
    def test_rejects_non_won_prospect(
        self,
        prospect_objects,
        create_client,
        opportunity_objects,
        quotation_objects,
    ):
        prospect = type(
            "ProspectStub",
            (),
            {
                "status": ProspectStatus.QUALIFIED,
                "converted_client_id": None,
            },
        )()
        prospect_objects.select_for_update.return_value.select_related.return_value.get.return_value = prospect

        with self.assertRaises(ValidationError):
            ProspectConversionService.convert(prospect_id=uuid4())

        create_client.assert_not_called()

    @patch("commercial.services.prospect_conversion_service.Quotation.objects")
    @patch("commercial.services.prospect_conversion_service.Opportunity.objects")
    @patch("commercial.services.prospect_conversion_service.ClientService.create_from_prospect")
    @patch("commercial.services.prospect_conversion_service.Prospect.objects")
    def test_returns_existing_conversion_without_creating_duplicate_client(
        self,
        prospect_objects,
        create_client,
        opportunity_objects,
        quotation_objects,
    ):
        client_id = uuid4()
        prospect = type(
            "ProspectStub",
            (),
            {
                "status": ProspectStatus.CONVERTED,
                "converted_client_id": client_id,
            },
        )()
        prospect_objects.select_for_update.return_value.select_related.return_value.get.return_value = prospect

        result = ProspectConversionService.convert(prospect_id=uuid4())

        self.assertEqual(result.client_id, client_id)
        create_client.assert_not_called()
