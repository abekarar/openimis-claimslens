from dataclasses import dataclass, field


@dataclass
class ClassificationResult:
    document_type: str
    confidence: float
    alternatives: list[dict] = field(default_factory=list)
    raw_response: dict | None = None


@dataclass
class ExtractionFieldResult:
    field_name: str
    value: str | None
    confidence: float
    bounding_box: dict | None = None


@dataclass
class ExtractionResult:
    fields: list[ExtractionFieldResult]
    aggregate_confidence: float
    raw_response: dict | None = None
    processing_ms: int = 0

    def to_structured_data(self) -> dict:
        return {f.field_name: f.value for f in self.fields}

    def to_field_confidences(self) -> dict:
        return {f.field_name: f.confidence for f in self.fields}


@dataclass
class EngineHealthStatus:
    healthy: bool
    latency_ms: int | None = None
    error: str | None = None


@dataclass
class EngineCapabilities:
    supported_languages: list[str] = field(default_factory=lambda: ["en"])
    max_image_size_bytes: int = 20 * 1024 * 1024
    supports_pdf: bool = True
    supports_multi_page: bool = False
    model_id: str = ""
