import logging

from claimlens.engine.base import BaseLLMEngine, register_adapter
from claimlens.engine.types import LLMResponse

logger = logging.getLogger(__name__)


@register_adapter('openai_compatible')
@register_adapter('mistral')
@register_adapter('deepseek')
class OpenAICompatibleEngine(BaseLLMEngine):

    def classify(self, image_bytes, mime_type, document_types, document_type_code=None):
        try:
            prompt = self._build_classification_prompt(document_types, document_type_code=document_type_code)
            data_url = self._encode_image(image_bytes, mime_type)

            payload = {
                "model": self.model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ],
                    }
                ],
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
            }

            url = f"{self.endpoint_url}/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            resp_data, elapsed_ms = self._make_request(url, headers, payload)
            content = resp_data["choices"][0]["message"]["content"]
            parsed = self._parse_json_response(content)
            tokens = resp_data.get("usage", {}).get("total_tokens", 0)

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
            logger.error("OpenAI-compatible classification failed: %s", e)
            return LLMResponse(success=False, error=str(e), engine_name=self.name)

    def extract(self, image_bytes, mime_type, extraction_template, document_type_code=None):
        try:
            prompt = self._build_extraction_prompt(extraction_template, document_type_code=document_type_code)
            data_url = self._encode_image(image_bytes, mime_type)

            payload = {
                "model": self.model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ],
                    }
                ],
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
            }

            url = f"{self.endpoint_url}/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            resp_data, elapsed_ms = self._make_request(url, headers, payload)
            content = resp_data["choices"][0]["message"]["content"]
            parsed = self._parse_json_response(content)
            tokens = resp_data.get("usage", {}).get("total_tokens", 0)

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
            logger.error("OpenAI-compatible extraction failed: %s", e)
            return LLMResponse(success=False, error=str(e), engine_name=self.name)
