import logging

from claimlens.engine.base import ADAPTER_REGISTRY
from claimlens.engine.types import LLMResponse

# Import adapters to trigger registration
import claimlens.engine.adapters.openai_compatible  # noqa: F401
import claimlens.engine.adapters.gemini              # noqa: F401

logger = logging.getLogger(__name__)


class EngineManager:

    def __init__(self):
        self._engines = []

    def load_engines(self):
        from claimlens.models import EngineConfig
        from claimlens.services import EngineConfigService

        self._engines = []
        configs = EngineConfig.objects.filter(is_active=True, is_deleted=False).order_by(
            '-is_primary', '-is_fallback'
        )

        for config in configs:
            adapter_cls = ADAPTER_REGISTRY.get(config.adapter)
            if not adapter_cls:
                logger.warning("Unknown adapter: %s for engine %s", config.adapter, config.name)
                continue

            api_key = ''
            if config.api_key_encrypted:
                try:
                    api_key = EngineConfigService.decrypt_api_key(config.api_key_encrypted)
                except Exception as e:
                    logger.error("Failed to decrypt API key for %s: %s", config.name, e)
                    continue

            engine = adapter_cls({
                'name': config.name,
                'endpoint_url': config.endpoint_url,
                'api_key': api_key,
                'model_name': config.model_name,
                'max_tokens': config.max_tokens,
                'temperature': config.temperature,
                'timeout_seconds': config.timeout_seconds,
            })
            self._engines.append((config, engine))

        logger.info("Loaded %d engines", len(self._engines))

    def classify(self, image_bytes, mime_type, document_types):
        return self._execute_with_fallback('classify', image_bytes, mime_type, document_types)

    def extract(self, image_bytes, mime_type, extraction_template):
        return self._execute_with_fallback('extract', image_bytes, mime_type, extraction_template)

    def classify_routed(self, image_bytes, mime_type, document_types, language=None):
        """Try scored engine selection for classification, fall back to primary/fallback."""
        selected = self.select_engine(language, document_type=None)
        if selected:
            config, engine = selected
            try:
                result = engine.classify(image_bytes, mime_type, document_types)
                if result.success:
                    return result, config
            except Exception as e:
                logger.warning("Routed engine %s failed classify: %s, falling back", config.name, e)
        return self._execute_with_fallback('classify', image_bytes, mime_type, document_types), None

    def extract_routed(self, image_bytes, mime_type, extraction_template, language=None, document_type=None):
        """Try scored engine selection for extraction, fall back to primary/fallback."""
        selected = self.select_engine(language, document_type)
        if selected:
            config, engine = selected
            try:
                result = engine.extract(image_bytes, mime_type, extraction_template)
                if result.success:
                    return result, config
            except Exception as e:
                logger.warning("Routed engine %s failed extract: %s, falling back", config.name, e)
        return self._execute_with_fallback('extract', image_bytes, mime_type, extraction_template), None

    def select_engine(self, language=None, document_type=None):
        """Select best engine based on EngineCapabilityScore and RoutingPolicy weights.

        Returns (config, engine) tuple or None if no capability scores match.
        """
        if not language:
            return None

        from claimlens.models import EngineCapabilityScore, RoutingPolicy

        scores_qs = EngineCapabilityScore.objects.filter(
            is_active=True, is_deleted=False,
            language=language,
            engine_config__is_active=True, engine_config__is_deleted=False,
        )
        if document_type:
            # Try exact document_type match first, then fall back to wildcard (null)
            typed = scores_qs.filter(document_type=document_type)
            if typed.exists():
                scores_qs = typed
            else:
                scores_qs = scores_qs.filter(document_type__isnull=True)
        else:
            scores_qs = scores_qs.filter(document_type__isnull=True)

        scores_list = list(scores_qs.select_related('engine_config'))
        if not scores_list:
            return None

        policy = RoutingPolicy.objects.first()
        acc_w = policy.accuracy_weight if policy else 0.50
        cost_w = policy.cost_weight if policy else 0.30
        speed_w = policy.speed_weight if policy else 0.20

        # Normalize cost: find max cost to compute inverted score
        max_cost = max(float(s.cost_per_page) for s in scores_list) or 1.0
        if max_cost == 0:
            max_cost = 1.0

        if not self._engines:
            self.load_engines()

        engine_map = {cfg.id: (cfg, eng) for cfg, eng in self._engines}

        best_score = -1
        best_engine = None

        for cap in scores_list:
            config_id = cap.engine_config_id
            if config_id not in engine_map:
                continue

            cfg, eng = engine_map[config_id]
            normalized_cost = (1.0 - float(cap.cost_per_page) / max_cost) * 100
            composite = (
                acc_w * cap.accuracy_score
                + cost_w * normalized_cost
                + speed_w * cap.speed_score
            )

            if composite > best_score:
                # Verify engine health before selecting
                try:
                    if eng.health_check():
                        best_score = composite
                        best_engine = (cfg, eng)
                except Exception:
                    logger.warning("Health check failed for %s during routing", cfg.name)

        if best_engine:
            logger.info(
                "Routed to engine %s (score=%.2f) for language=%s",
                best_engine[0].name, best_score, language
            )

        return best_engine

    def _execute_with_fallback(self, method_name, *args):
        if not self._engines:
            self.load_engines()

        if not self._engines:
            return LLMResponse(success=False, error="No active engines configured")

        last_error = None
        for config, engine in self._engines:
            try:
                method = getattr(engine, method_name)
                result = method(*args)
                if result.success:
                    return result
                last_error = result.error
                logger.warning(
                    "Engine %s failed for %s: %s, trying next",
                    engine.name, method_name, result.error
                )
            except Exception as e:
                last_error = str(e)
                logger.warning(
                    "Engine %s raised exception for %s: %s, trying next",
                    engine.name, method_name, e
                )

        return LLMResponse(
            success=False,
            error=f"All engines failed. Last error: {last_error}"
        )

    def get_primary_engine_config(self):
        if not self._engines:
            self.load_engines()
        for config, engine in self._engines:
            if config.is_primary:
                return config
        return self._engines[0][0] if self._engines else None

    def health_check(self):
        if not self._engines:
            self.load_engines()
        results = {}
        for config, engine in self._engines:
            results[config.name] = engine.health_check()
        return results
