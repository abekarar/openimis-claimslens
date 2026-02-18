from dataclasses import dataclass, field
from typing import Optional


@dataclass
class LLMResponse:
    success: bool
    data: dict = field(default_factory=dict)
    confidence: float = 0.0
    raw_response: dict = field(default_factory=dict)
    tokens_used: int = 0
    processing_time_ms: int = 0
    error: Optional[str] = None
    engine_name: Optional[str] = None
