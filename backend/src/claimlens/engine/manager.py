import structlog

from claimlens.config import settings
from claimlens.engine.adapters.mistral import MistralEngine
from claimlens.engine.base import BaseLLMEngine
from claimlens.engine.types import (
    ClassificationResult,
    ExtractionResult,
)

logger = structlog.get_logger()

ADAPTER_REGISTRY: dict[str, type[BaseLLMEngine]] = {
    "mistral": MistralEngine,
}


class EngineManager:
    """Engine selection with primary-fallback strategy."""

    def __init__(self) -> None:
        self._engines: dict[str, BaseLLMEngine] = {}
        self._primary: str | None = None

    def register_engine(self, name: str, engine: BaseLLMEngine, primary: bool = False) -> None:
        self._engines[name] = engine
        if primary or self._primary is None:
            self._primary = name
        logger.info("engine_registered", name=name, primary=primary)

    def get_engine(self, name: str | None = None) -> BaseLLMEngine:
        if name and name in self._engines:
            return self._engines[name]
        if self._primary and self._primary in self._engines:
            return self._engines[self._primary]
        raise RuntimeError("No LLM engine configured")

    async def classify(
        self,
        image: bytes,
        document_types: list[dict],
        language_hint: str | None = None,
    ) -> ClassificationResult:
        engine = self.get_engine()
        return await engine.classify_document(image, document_types, language_hint)

    async def extract(
        self,
        image: bytes,
        document_type: str,
        extraction_template: dict,
        language_hint: str | None = None,
    ) -> ExtractionResult:
        engine = self.get_engine()
        return await engine.extract_fields(image, document_type, extraction_template, language_hint)


def create_default_manager() -> EngineManager:
    """Create engine manager with default config from settings."""
    manager = EngineManager()

    if settings.engine.mistral_api_key:
        engine = MistralEngine(
            api_key=settings.engine.mistral_api_key,
            model=settings.engine.mistral_model,
            endpoint=settings.engine.mistral_endpoint,
        )
        manager.register_engine("mistral", engine, primary=True)

    return manager
