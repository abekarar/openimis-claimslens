import base64
import json
import logging
import os
import time
from abc import ABC, abstractmethod
from functools import lru_cache

import httpx

from claimlens.engine.types import LLMResponse

logger = logging.getLogger(__name__)

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), 'prompts')


@lru_cache(maxsize=4)
def _load_prompt(filename):
    path = os.path.join(PROMPTS_DIR, filename)
    with open(path, 'r') as f:
        return f.read()


def _resolve_prompt(prompt_type, document_type_code=None):
    """
    Resolution order:
    1. Active per-DocType override (if document_type_code provided)
    2. Active global prompt (document_type=null)
    3. File-based fallback (existing .md files)
    """
    from claimlens.models import PromptTemplate

    if document_type_code:
        override = PromptTemplate.objects.filter(
            prompt_type=prompt_type,
            document_type__code=document_type_code,
            is_active=True, is_deleted=False,
        ).first()
        if override:
            return override.content

    global_prompt = PromptTemplate.objects.filter(
        prompt_type=prompt_type,
        document_type__isnull=True,
        is_active=True, is_deleted=False,
    ).first()
    if global_prompt:
        return global_prompt.content

    # Fallback to file
    return _load_prompt(f'{prompt_type}.md')

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
    def classify(self, image_bytes, mime_type, document_types, document_type_code=None):
        pass

    @abstractmethod
    def extract(self, image_bytes, mime_type, extraction_template, document_type_code=None):
        pass

    def health_check(self):
        try:
            with httpx.Client(timeout=10) as client:
                resp = client.get(self.endpoint_url)
                return resp.status_code < 500
        except Exception:
            return False

    def _encode_image(self, image_bytes, mime_type):
        if mime_type == 'application/pdf':
            image_bytes, mime_type = self._pdf_to_png(image_bytes)
        b64 = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:{mime_type};base64,{b64}"

    @staticmethod
    def _pdf_to_png(pdf_bytes):
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[0]
        pix = page.get_pixmap(dpi=200)
        png_bytes = pix.tobytes("png")
        doc.close()
        return png_bytes, "image/png"

    def _build_classification_prompt(self, document_types, document_type_code=None):
        type_descriptions = []
        for dt in document_types:
            hints = f" (hints: {dt['classification_hints']})" if dt.get('classification_hints') else ""
            type_descriptions.append(f"- {dt['code']}: {dt['name']}{hints}")

        types_text = "\n".join(type_descriptions)
        template = _resolve_prompt('classification', document_type_code)
        return template.format_map({'types_text': types_text})

    def _build_extraction_prompt(self, extraction_template, document_type_code=None):
        fields_text = json.dumps(extraction_template, indent=2)

        array_fields = [
            k for k, v in extraction_template.items()
            if isinstance(v, dict) and v.get('type') == 'array'
        ]

        array_instructions = ""
        if array_fields:
            array_instructions = (
                "\nFor array fields (those with type \"array\" in the template), "
                "extract ALL matching items from the document as a JSON array. "
                "Each element should be an object matching the \"items\" schema. "
                "The \"value\" must be a JSON array of objects, and \"confidence\" "
                "should reflect overall confidence for the array extraction.\n"
            )

        template = _resolve_prompt('extraction', document_type_code)
        return template.format_map({
            'fields_text': fields_text,
            'array_instructions': array_instructions,
        })

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
