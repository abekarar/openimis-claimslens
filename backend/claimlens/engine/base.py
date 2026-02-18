import base64
import json
import logging
import time
from abc import ABC, abstractmethod

import httpx

from claimlens.engine.types import LLMResponse

logger = logging.getLogger(__name__)

ADAPTER_REGISTRY = {}


def register_adapter(name):
    def decorator(cls):
        ADAPTER_REGISTRY[name] = cls
        return cls
    return decorator


class BaseLLMEngine(ABC):

    def __init__(self, config):
        self.name = config.get('name', 'unknown')
        self.endpoint_url = config['endpoint_url']
        self.api_key = config.get('api_key', '')
        self.model_name = config['model_name']
        self.max_tokens = config.get('max_tokens', 4096)
        self.temperature = config.get('temperature', 0.1)
        self.timeout = config.get('timeout_seconds', 120)

    @abstractmethod
    def classify(self, image_bytes, mime_type, document_types):
        pass

    @abstractmethod
    def extract(self, image_bytes, mime_type, extraction_template):
        pass

    def health_check(self):
        try:
            with httpx.Client(timeout=10) as client:
                resp = client.get(self.endpoint_url)
                return resp.status_code < 500
        except Exception:
            return False

    def _encode_image(self, image_bytes, mime_type):
        b64 = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:{mime_type};base64,{b64}"

    def _build_classification_prompt(self, document_types):
        type_descriptions = []
        for dt in document_types:
            hints = f" (hints: {dt['classification_hints']})" if dt.get('classification_hints') else ""
            type_descriptions.append(f"- {dt['code']}: {dt['name']}{hints}")

        types_text = "\n".join(type_descriptions)
        return (
            "You are a document classification system. Analyze the provided document image "
            "and classify it into one of the following document types:\n\n"
            f"{types_text}\n\n"
            "Respond with a JSON object containing:\n"
            '- "document_type_code": the code of the matching document type\n'
            '- "confidence": a float between 0 and 1 indicating classification confidence\n'
            '- "reasoning": brief explanation of why this classification was chosen\n\n'
            "Respond ONLY with valid JSON, no additional text."
        )

    def _build_extraction_prompt(self, extraction_template):
        fields_text = json.dumps(extraction_template, indent=2)
        return (
            "You are a document data extraction system. Extract structured data from the "
            "provided document image according to this template:\n\n"
            f"{fields_text}\n\n"
            "For each field, provide:\n"
            '- The extracted value\n'
            '- A confidence score between 0 and 1\n\n'
            "Respond with a JSON object containing:\n"
            '- "fields": object mapping field names to {"value": ..., "confidence": float}\n'
            '- "aggregate_confidence": overall extraction confidence (float 0-1)\n\n'
            "Respond ONLY with valid JSON, no additional text."
        )

    def _parse_json_response(self, text):
        text = text.strip()
        if text.startswith('```'):
            lines = text.split('\n')
            lines = lines[1:]
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            text = '\n'.join(lines)
        return json.loads(text)

    def _make_request(self, url, headers, payload):
        start = time.time()
        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
        elapsed_ms = int((time.time() - start) * 1000)
        return response.json(), elapsed_ms
