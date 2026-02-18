import io

import structlog
from PIL import Image

from claimlens.config import settings

logger = structlog.get_logger()

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/tiff",
    "application/pdf",
}

MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
    b"II*\x00": "image/tiff",
    b"MM\x00*": "image/tiff",
    b"%PDF": "application/pdf",
}


class ValidationError(Exception):
    def __init__(self, message: str, code: str = "VALIDATION_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


def detect_mime_type(data: bytes) -> str | None:
    for magic, mime in MAGIC_BYTES.items():
        if data[: len(magic)] == magic:
            return mime
    return None


def validate_file(data: bytes, filename: str, content_type: str | None = None) -> str:
    """Validate uploaded file. Returns detected MIME type."""
    max_size = settings.max_file_size_mb * 1024 * 1024
    if len(data) > max_size:
        raise ValidationError(
            f"File exceeds maximum size of {settings.max_file_size_mb}MB",
            code="FILE_TOO_LARGE",
        )

    if len(data) == 0:
        raise ValidationError("File is empty", code="FILE_EMPTY")

    detected = detect_mime_type(data)
    if detected is None:
        raise ValidationError("Unrecognized file format", code="UNSUPPORTED_FORMAT")

    if detected not in ALLOWED_MIME_TYPES:
        raise ValidationError(f"File type {detected} is not supported", code="UNSUPPORTED_FORMAT")

    # Basic corruption check for images
    if detected.startswith("image/"):
        try:
            img = Image.open(io.BytesIO(data))
            img.verify()
        except Exception as exc:
            raise ValidationError(
                "Image file appears to be corrupted", code="FILE_CORRUPTED"
            ) from exc

    logger.info("file_validated", filename=filename, mime_type=detected, size=len(data))
    return detected
