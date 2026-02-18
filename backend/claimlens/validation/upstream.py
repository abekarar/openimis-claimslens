import logging
from datetime import datetime as py_datetime

from django.utils import timezone

from claimlens.models import ValidationResult, ValidationFinding, AuditLog

logger = logging.getLogger(__name__)


class UpstreamValidationService:
    """Compares OCR-extracted data against linked openIMIS Claim."""

    def validate(self, document, user):
        if not document.claim_uuid:
            logger.info("Document %s has no claim_uuid, skipping upstream validation", document.id)
            return None

        try:
            from claim.models import Claim
        except ImportError:
            logger.warning("claim module not available, skipping upstream validation")
            return None

        claim = Claim.objects.filter(
            uuid=document.claim_uuid, validity_to__isnull=True
        ).select_related(
            'insuree', 'health_facility', 'icd'
        ).prefetch_related(
            'items__item', 'services__service'
        ).first()

        if not claim:
            logger.warning("No claim found for uuid %s", document.claim_uuid)
            return self._create_error_result(document, user, f"Claim {document.claim_uuid} not found")

        extraction_result = getattr(document, 'extraction_result', None)
        if not extraction_result:
            return self._create_error_result(document, user, "No extraction result available")

        ocr_data = extraction_result.structured_data or {}
        field_comparisons = {}
        discrepancies = []

        # Patient fields
        self._compare(field_comparisons, discrepancies, 'chf_id',
                      ocr_data.get('chf_id'), getattr(claim.insuree, 'chf_id', None))
        self._compare(field_comparisons, discrepancies, 'last_name',
                      ocr_data.get('last_name'), getattr(claim.insuree, 'last_name', None))
        self._compare(field_comparisons, discrepancies, 'other_names',
                      ocr_data.get('other_names'), getattr(claim.insuree, 'other_names', None))
        self._compare(field_comparisons, discrepancies, 'dob',
                      ocr_data.get('dob'), self._format_date(getattr(claim.insuree, 'dob', None)))

        # Visit fields
        self._compare(field_comparisons, discrepancies, 'date_from',
                      ocr_data.get('date_from'), self._format_date(claim.date_from))
        self._compare(field_comparisons, discrepancies, 'date_to',
                      ocr_data.get('date_to'), self._format_date(claim.date_to))
        self._compare(field_comparisons, discrepancies, 'visit_type',
                      ocr_data.get('visit_type'), claim.visit_type if hasattr(claim, 'visit_type') else None)

        # Facility fields
        if claim.health_facility:
            self._compare(field_comparisons, discrepancies, 'facility_code',
                          ocr_data.get('facility_code'), claim.health_facility.code)
            self._compare(field_comparisons, discrepancies, 'facility_name',
                          ocr_data.get('facility_name'), claim.health_facility.name)

        # Diagnosis
        if claim.icd:
            self._compare(field_comparisons, discrepancies, 'icd_code',
                          ocr_data.get('icd_code'), claim.icd.code)

        # Items matching by code
        ocr_items = ocr_data.get('items', [])
        if isinstance(ocr_items, list):
            claim_items = {ci.item.code: ci for ci in claim.items.all() if ci.item}
            for ocr_item in ocr_items:
                item_code = ocr_item.get('code', '')
                ci = claim_items.get(item_code)
                if ci:
                    self._compare(field_comparisons, discrepancies, f'item_{item_code}_qty',
                                  ocr_item.get('quantity'), ci.qty_provided)
                    self._compare(field_comparisons, discrepancies, f'item_{item_code}_price',
                                  ocr_item.get('price'), float(ci.price_asked) if ci.price_asked else None)
                else:
                    field_comparisons[f'item_{item_code}'] = {
                        'ocr': ocr_item, 'claim': None, 'match': False
                    }
                    discrepancies.append(f'item_{item_code}')

        # Services matching by code
        ocr_services = ocr_data.get('services', [])
        if isinstance(ocr_services, list):
            claim_services = {cs.service.code: cs for cs in claim.services.all() if cs.service}
            for ocr_svc in ocr_services:
                svc_code = ocr_svc.get('code', '')
                cs = claim_services.get(svc_code)
                if cs:
                    self._compare(field_comparisons, discrepancies, f'service_{svc_code}_qty',
                                  ocr_svc.get('quantity'), cs.qty_provided)
                    self._compare(field_comparisons, discrepancies, f'service_{svc_code}_price',
                                  ocr_svc.get('price'), float(cs.price_asked) if cs.price_asked else None)
                else:
                    field_comparisons[f'service_{svc_code}'] = {
                        'ocr': ocr_svc, 'claim': None, 'match': False
                    }
                    discrepancies.append(f'service_{svc_code}')

        # Total amount
        self._compare(field_comparisons, discrepancies, 'claimed_amount',
                      ocr_data.get('claimed_amount'),
                      float(claim.claimed) if claim.claimed else None)

        # Compute overall status
        total_fields = len(field_comparisons)
        matched_fields = sum(1 for v in field_comparisons.values() if v.get('match'))
        match_score = matched_fields / total_fields if total_fields > 0 else 0.0

        if len(discrepancies) == 0:
            overall_status = ValidationResult.OverallStatus.MATCHED
        elif match_score >= 0.8:
            overall_status = ValidationResult.OverallStatus.PARTIAL_MATCH
        else:
            overall_status = ValidationResult.OverallStatus.MISMATCHED

        vr = ValidationResult(
            document=document,
            validation_type=ValidationResult.ValidationType.UPSTREAM,
            overall_status=overall_status,
            field_comparisons=field_comparisons,
            discrepancy_count=len(discrepancies),
            match_score=match_score,
            summary=f"{matched_fields}/{total_fields} fields matched",
            validated_at=timezone.now(),
        )
        vr.save(user=user)

        # Create findings for discrepancies
        for field_name in discrepancies:
            comp = field_comparisons.get(field_name, {})
            ValidationFinding(
                validation_result=vr,
                finding_type=ValidationFinding.FindingType.WARNING,
                severity='warning',
                field=field_name,
                description=f"OCR value does not match claim data for {field_name}",
                details={
                    'ocr_value': comp.get('ocr'),
                    'claim_value': comp.get('claim'),
                },
            ).save(user=user)

        AuditLog(
            document=document,
            action=AuditLog.Action.REVIEW,
            details={
                'validation_type': 'upstream',
                'overall_status': overall_status,
                'match_score': match_score,
                'discrepancy_count': len(discrepancies),
            },
        ).save(user=user)

        return vr

    def _compare(self, comparisons, discrepancies, field_name, ocr_val, claim_val):
        """Compare an OCR-extracted value against the claim value."""
        ocr_str = str(ocr_val).strip().lower() if ocr_val is not None else ''
        claim_str = str(claim_val).strip().lower() if claim_val is not None else ''
        match = ocr_str == claim_str
        comparisons[field_name] = {
            'ocr': ocr_val,
            'claim': claim_val,
            'match': match,
        }
        if not match and (ocr_val is not None or claim_val is not None):
            discrepancies.append(field_name)

    def _format_date(self, dt):
        if dt is None:
            return None
        if hasattr(dt, 'strftime'):
            return dt.strftime('%Y-%m-%d')
        return str(dt)

    def _create_error_result(self, document, user, error_msg):
        vr = ValidationResult(
            document=document,
            validation_type=ValidationResult.ValidationType.UPSTREAM,
            overall_status=ValidationResult.OverallStatus.ERROR,
            summary=error_msg,
            validated_at=timezone.now(),
        )
        vr.save(user=user)
        return vr
