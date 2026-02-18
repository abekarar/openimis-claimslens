import logging
from datetime import datetime as py_datetime

from django.utils import timezone

from claimlens.models import (
    ValidationResult, ValidationRule, ValidationFinding,
    RegistryUpdateProposal, AuditLog,
)

logger = logging.getLogger(__name__)


class DownstreamValidationService:
    """Applies business rules (eligibility, clinical, fraud, registry) to extracted data."""

    def validate(self, document, user):
        extraction_result = getattr(document, 'extraction_result', None)
        if not extraction_result:
            logger.info("Document %s has no extraction result, skipping downstream validation", document.id)
            return None

        ocr_data = extraction_result.structured_data or {}
        rules = ValidationRule.objects.filter(is_active=True, is_deleted=False)

        findings = []
        proposals = []

        for rule in rules:
            if rule.rule_type == ValidationRule.RuleType.ELIGIBILITY:
                findings.extend(self._check_eligibility(rule, document, ocr_data))
            elif rule.rule_type == ValidationRule.RuleType.CLINICAL:
                findings.extend(self._check_clinical(rule, document, ocr_data))
            elif rule.rule_type == ValidationRule.RuleType.FRAUD:
                findings.extend(self._check_fraud(rule, document, ocr_data))
            elif rule.rule_type == ValidationRule.RuleType.REGISTRY:
                new_proposals = self._detect_registry_updates(rule, document, ocr_data)
                proposals.extend(new_proposals)
                for p in new_proposals:
                    findings.append({
                        'rule': rule,
                        'finding_type': ValidationFinding.FindingType.UPDATE_PROPOSAL,
                        'severity': rule.severity,
                        'field': p['field_name'],
                        'description': f"Registry update proposed: {p['field_name']}",
                        'details': {
                            'current': p['current_value'],
                            'proposed': p['proposed_value'],
                            'target_model': p['target_model'],
                        },
                    })

        # Determine overall status
        errors = [f for f in findings if f['severity'] == 'error']
        warnings = [f for f in findings if f['severity'] == 'warning']

        if errors:
            overall_status = ValidationResult.OverallStatus.MISMATCHED
        elif warnings:
            overall_status = ValidationResult.OverallStatus.PARTIAL_MATCH
        else:
            overall_status = ValidationResult.OverallStatus.MATCHED

        vr = ValidationResult(
            document=document,
            validation_type=ValidationResult.ValidationType.DOWNSTREAM,
            overall_status=overall_status,
            field_comparisons={},
            discrepancy_count=len(findings),
            match_score=1.0 if not findings else max(0.0, 1.0 - len(findings) * 0.1),
            summary=f"{len(errors)} errors, {len(warnings)} warnings, {len(proposals)} proposals",
            validated_at=timezone.now(),
        )
        vr.save(user=user)

        # Persist findings
        for f in findings:
            ValidationFinding(
                validation_result=vr,
                validation_rule=f.get('rule'),
                finding_type=f['finding_type'],
                severity=f['severity'],
                field=f.get('field', ''),
                description=f.get('description', ''),
                details=f.get('details', {}),
            ).save(user=user)

        # Persist registry proposals
        for p in proposals:
            RegistryUpdateProposal(
                document=document,
                validation_result=vr,
                target_model=p['target_model'],
                target_uuid=p['target_uuid'],
                field_name=p['field_name'],
                current_value=str(p['current_value'] or ''),
                proposed_value=str(p['proposed_value'] or ''),
            ).save(user=user)

        AuditLog(
            document=document,
            action=AuditLog.Action.REVIEW,
            details={
                'validation_type': 'downstream',
                'overall_status': overall_status,
                'findings_count': len(findings),
                'proposals_count': len(proposals),
            },
        ).save(user=user)

        return vr

    def _check_eligibility(self, rule, document, ocr_data):
        """Check that insuree has an active policy covering the claim date and items/services."""
        findings = []

        if not document.claim_uuid:
            return findings

        try:
            from claim.models import Claim
            from policy.models import Policy
        except ImportError:
            return findings

        claim = Claim.objects.filter(
            uuid=document.claim_uuid, validity_to__isnull=True
        ).select_related('insuree').first()

        if not claim or not claim.insuree:
            return findings

        # Check active policy on claim date
        claim_date = claim.date_from or claim.date_claimed
        if claim_date:
            active_policy = Policy.objects.filter(
                family__members__id=claim.insuree.id,
                effective_date__lte=claim_date,
                expiry_date__gte=claim_date,
                status=Policy.STATUS_ACTIVE,
                validity_to__isnull=True,
            ).first()

            if not active_policy:
                findings.append({
                    'rule': rule,
                    'finding_type': ValidationFinding.FindingType.VIOLATION,
                    'severity': 'error',
                    'field': 'policy',
                    'description': f"No active policy found for insuree on {claim_date}",
                    'details': {
                        'insuree_id': str(claim.insuree.id),
                        'claim_date': str(claim_date),
                    },
                })
            else:
                # Check items/services covered by product
                try:
                    from product.models import ProductItem, ProductService
                    product = active_policy.product

                    if product:
                        for ci in claim.items.all():
                            if ci.item and not ProductItem.objects.filter(
                                product=product, item=ci.item, validity_to__isnull=True
                            ).exists():
                                findings.append({
                                    'rule': rule,
                                    'finding_type': ValidationFinding.FindingType.WARNING,
                                    'severity': 'warning',
                                    'field': f'item_{ci.item.code}',
                                    'description': f"Item {ci.item.code} not covered by product {product.code}",
                                    'details': {'item_code': ci.item.code, 'product_code': product.code},
                                })

                        for cs in claim.services.all():
                            if cs.service and not ProductService.objects.filter(
                                product=product, service=cs.service, validity_to__isnull=True
                            ).exists():
                                findings.append({
                                    'rule': rule,
                                    'finding_type': ValidationFinding.FindingType.WARNING,
                                    'severity': 'warning',
                                    'field': f'service_{cs.service.code}',
                                    'description': f"Service {cs.service.code} not covered by product {product.code}",
                                    'details': {'service_code': cs.service.code, 'product_code': product.code},
                                })
                except ImportError:
                    pass

        return findings

    def _check_clinical(self, rule, document, ocr_data):
        """Check diagnosis-service compatibility using rule_definition.allowed_icd_service_map."""
        findings = []
        rule_def = rule.rule_definition or {}
        allowed_map = rule_def.get('allowed_icd_service_map', {})

        if not allowed_map:
            return findings

        icd_code = ocr_data.get('icd_code', '')
        allowed_services = allowed_map.get(icd_code, None)

        if allowed_services is None:
            return findings

        ocr_services = ocr_data.get('services', [])
        if isinstance(ocr_services, list):
            for svc in ocr_services:
                svc_code = svc.get('code', '')
                if svc_code and svc_code not in allowed_services:
                    findings.append({
                        'rule': rule,
                        'finding_type': ValidationFinding.FindingType.WARNING,
                        'severity': rule.severity,
                        'field': f'service_{svc_code}',
                        'description': f"Service {svc_code} not clinically compatible with diagnosis {icd_code}",
                        'details': {
                            'icd_code': icd_code,
                            'service_code': svc_code,
                            'allowed_services': allowed_services,
                        },
                    })

        return findings

    def _check_fraud(self, rule, document, ocr_data):
        """Check for duplicate claims: same insuree + facility + date."""
        findings = []

        if not document.claim_uuid:
            return findings

        try:
            from claim.models import Claim
        except ImportError:
            return findings

        claim = Claim.objects.filter(
            uuid=document.claim_uuid, validity_to__isnull=True
        ).first()

        if not claim:
            return findings

        duplicates = Claim.objects.filter(
            insuree=claim.insuree,
            health_facility=claim.health_facility,
            date_from=claim.date_from,
            validity_to__isnull=True,
        ).exclude(uuid=claim.uuid)

        if duplicates.exists():
            findings.append({
                'rule': rule,
                'finding_type': ValidationFinding.FindingType.WARNING,
                'severity': rule.severity,
                'field': 'duplicate_claim',
                'description': (
                    f"Potential duplicate: {duplicates.count()} other claim(s) with same "
                    f"insuree, facility, and date"
                ),
                'details': {
                    'duplicate_uuids': [str(d.uuid) for d in duplicates[:5]],
                    'insuree_chf_id': claim.insuree.chf_id if claim.insuree else None,
                    'facility_code': claim.health_facility.code if claim.health_facility else None,
                    'date_from': str(claim.date_from),
                },
            })

        return findings

    def _detect_registry_updates(self, rule, document, ocr_data):
        """Detect differences between OCR data and registry (insuree/health_facility) for update proposals."""
        proposals = []

        if not document.claim_uuid:
            return proposals

        try:
            from claim.models import Claim
        except ImportError:
            return proposals

        claim = Claim.objects.filter(
            uuid=document.claim_uuid, validity_to__isnull=True
        ).select_related('insuree', 'health_facility').first()

        if not claim:
            return proposals

        # Insuree registry fields
        if claim.insuree:
            insuree = claim.insuree
            registry_fields = rule.rule_definition.get('insuree_fields', ['phone', 'email'])

            for field_name in registry_fields:
                ocr_val = ocr_data.get(f'insuree_{field_name}') or ocr_data.get(field_name)
                current_val = getattr(insuree, field_name, None)

                if ocr_val and str(ocr_val).strip() and str(ocr_val).strip() != str(current_val or '').strip():
                    proposals.append({
                        'target_model': 'insuree',
                        'target_uuid': insuree.uuid,
                        'field_name': field_name,
                        'current_value': current_val,
                        'proposed_value': ocr_val,
                    })

        # Health facility registry fields
        if claim.health_facility:
            hf = claim.health_facility
            hf_fields = rule.rule_definition.get('facility_fields', [])

            for field_name in hf_fields:
                ocr_val = ocr_data.get(f'facility_{field_name}')
                current_val = getattr(hf, field_name, None)

                if ocr_val and str(ocr_val).strip() and str(ocr_val).strip() != str(current_val or '').strip():
                    proposals.append({
                        'target_model': 'health_facility',
                        'target_uuid': hf.uuid,
                        'field_name': field_name,
                        'current_value': current_val,
                        'proposed_value': ocr_val,
                    })

        return proposals
