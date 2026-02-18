import logging

from claimlens.engine.base import BaseLLMEngine, register_adapter
from claimlens.engine.types import LLMResponse

logger = logging.getLogger(__name__)


@register_adapter('gemini')
class GeminiEngine(BaseLLMEngine):

    def classify(self, image_bytes, mime_type, document_types):
        try:
            prompt = self._build_classification_prompt(document_types)
            import base64
            b64_image = base64.b64encode(image_bytes).decode('utf-8')

            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": b64_image,
                                }
                            },
                        ]
                    }
                ],
                "generationConfig": {
                    "maxOutputTokens": self.max_tokens,
                    "temperature": self.temperature,
                },
            }

            url = (
                f"{self.endpoint_url}/v1beta/models/{self.model_name}"
                f":generateContent?key={self.api_key}"
            )
            headers = {"Content-Type": "application/json"}

            resp_data, elapsed_ms = self._make_request(url, headers, payload)
            content = resp_data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = self._parse_json_response(content)
            tokens = resp_data.get("usageMetadata", {}).get("totalTokenCount", 0)

            return LLMResponse(
                success=True,
                data=parsed,
                confidence=parsed.get("confidence", 0.0),
                raw_response=resp_data,
                tokens_used=tokens,
                processing_time_ms=elapsed_ms,
                engine_name=self.name,
            )
        except Exception as e:
            logger.error("Gemini classification failed: %s", e)
            return LLMResponse(success=False, error=str(e), engine_name=self.name)

    def extract(self, image_bytes, mime_type, extraction_template):
        try:
            prompt = self._build_extraction_prompt(extraction_template)
            import base64
            b64_image = base64.b64encode(image_bytes).decode('utf-8')

            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": b64_image,
                                }
                            },
                        ]
                    }
                ],
                "generationConfig": {
                    "maxOutputTokens": self.max_tokens,
                    "temperature": self.temperature,
                },
            }

            url = (
                f"{self.endpoint_url}/v1beta/models/{self.model_name}"
                f":generateContent?key={self.api_key}"
            )
            headers = {"Content-Type": "application/json"}

            resp_data, elapsed_ms = self._make_request(url, headers, payload)
            content = resp_data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = self._parse_json_response(content)
            tokens = resp_data.get("usageMetadata", {}).get("totalTokenCount", 0)

            return LLMResponse(
                success=True,
                data=parsed,
                confidence=parsed.get("aggregate_confidence", 0.0),
                raw_response=resp_data,
                tokens_used=tokens,
                processing_time_ms=elapsed_ms,
                engine_name=self.name,
            )
        except Exception as e:
            logger.error("Gemini extraction failed: %s", e)
            return LLMResponse(success=False, error=str(e), engine_name=self.name)
