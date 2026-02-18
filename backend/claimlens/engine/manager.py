import logging

from claimlens.engine.base import ADAPTER_REGISTRY
from claimlens.engine.types import LLMResponse

# Import adapters to trigger registration
import claimlens.engine.adapters.mistral  # noqa: F401
import claimlens.engine.adapters.gemini   # noqa: F401
import claimlens.engine.adapters.deepseek  # noqa: F401

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
