from abc import ABC, abstractmethod

from claimlens.engine.types import (
    ClassificationResult,
    EngineCapabilities,
    EngineHealthStatus,
    ExtractionResult,
)


class BaseLLMEngine(ABC):
    """Abstract base class for LLM vision engine adapters."""

    @abstractmethod
    async def classify_document(
        self,
        image: bytes,
        document_types: list[dict],
        language_hint: str | None = None,
    ) -> ClassificationResult:
        """Classify a document image into a registered document type."""

    @abstractmethod
    async def extract_fields(
        self,
        image: bytes,
        document_type: str,
        extraction_template: dict,
        language_hint: str | None = None,
    ) -> ExtractionResult:
        """Extract structured fields from a document image."""

    @abstractmethod
    async def health_check(self) -> EngineHealthStatus:
        """Check engine availability and responsiveness."""

    @abstractmethod
    def get_capabilities(self) -> EngineCapabilities:
        """Return engine capability metadata."""
