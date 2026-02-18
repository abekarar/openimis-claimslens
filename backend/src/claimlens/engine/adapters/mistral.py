import base64
import json
import time

import httpx
import structlog

from claimlens.engine.base import BaseLLMEngine
from claimlens.engine.types import (
    ClassificationResult,
    EngineCapabilities,
    EngineHealthStatus,
    ExtractionFieldResult,
    ExtractionResult,
)

logger = structlog.get_logger()


class MistralEngine(BaseLLMEngine):
    def __init__(
        self,
        api_key: str,
        model: str = "pixtral-large-latest",
        endpoint: str = "https://api.mistral.ai/v1",
        timeout: int = 60,
    ):
        self.api_key = api_key
        self.model = model
        self.endpoint = endpoint.rstrip("/")
        self.timeout = timeout
        self._client = httpx.AsyncClient(
            base_url=self.endpoint,
            headers={"Authorization": f"Bearer {self.api_key}"},
            timeout=self.timeout,
        )

    async def classify_document(
        self,
        image: bytes,
        document_types: list[dict],
        language_hint: str | None = None,
    ) -> ClassificationResult:
        type_list = ", ".join(dt.get("name", dt.get("code", "unknown")) for dt in document_types)
        prompt = (
            f"Classify this document into one of these types: {type_list}. "
            "Return JSON with keys: document_type, confidence (0-1), alternatives (list)."
        )
        if language_hint:
            prompt += f" The document language is {language_hint}."

        response = await self._call_vision(image, prompt)

        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            data = {"document_type": "unknown", "confidence": 0.0}

        return ClassificationResult(
            document_type=data.get("document_type", "unknown"),
            confidence=float(data.get("confidence", 0.0)),
            alternatives=data.get("alternatives", []),
            raw_response=data,
        )

    async def extract_fields(
        self,
        image: bytes,
        document_type: str,
        extraction_template: dict,
        language_hint: str | None = None,
    ) -> ExtractionResult:
        fields = extraction_template.get("fields", [])
        field_list = ", ".join(f.get("name", "") for f in fields)
        prompt = (
            f"Extract these fields from this {document_type} document: {field_list}. "
            "Return JSON with key 'fields' containing a list of objects with: "
            "field_name, value, confidence (0-1)."
        )
        if language_hint:
            prompt += f" The document language is {language_hint}."

        start = time.monotonic()
        response = await self._call_vision(image, prompt)
        elapsed_ms = int((time.monotonic() - start) * 1000)

        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            data = {"fields": []}

        extracted = []
        for f in data.get("fields", []):
            extracted.append(
                ExtractionFieldResult(
                    field_name=f.get("field_name", ""),
                    value=f.get("value"),
                    confidence=float(f.get("confidence", 0.0)),
                    bounding_box=f.get("bounding_box"),
                )
            )

        confidences = [f.confidence for f in extracted] if extracted else [0.0]
        aggregate = sum(confidences) / len(confidences)

        return ExtractionResult(
            fields=extracted,
            aggregate_confidence=aggregate,
            raw_response=data,
            processing_ms=elapsed_ms,
        )

    async def health_check(self) -> EngineHealthStatus:
        try:
            start = time.monotonic()
            resp = await self._client.get("/models")
            latency = int((time.monotonic() - start) * 1000)
            return EngineHealthStatus(
                healthy=resp.status_code == 200,
                latency_ms=latency,
            )
        except Exception as e:
            return EngineHealthStatus(healthy=False, error=str(e))

    def get_capabilities(self) -> EngineCapabilities:
        return EngineCapabilities(
            supported_languages=["en", "fr", "de", "es", "ar", "sw"],
            max_image_size_bytes=20 * 1024 * 1024,
            supports_pdf=True,
            supports_multi_page=False,
            model_id=self.model,
        )

    async def _call_vision(self, image: bytes, prompt: str) -> str:
        b64_image = base64.b64encode(image).decode("utf-8")

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"},
                        },
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
            "temperature": 0.1,
            "max_tokens": 4096,
            "response_format": {"type": "json_object"},
        }

        resp = await self._client.post("/chat/completions", json=payload)
        resp.raise_for_status()

        data = resp.json()
        return data["choices"][0]["message"]["content"]
