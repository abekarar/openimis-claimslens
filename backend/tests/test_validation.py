import pytest

from claimlens.preprocessing.validation import ValidationError, detect_mime_type, validate_file


def test_detect_jpeg():
    data = b"\xff\xd8\xff" + b"\x00" * 100
    assert detect_mime_type(data) == "image/jpeg"


def test_detect_png():
    data = b"\x89PNG" + b"\x00" * 100
    assert detect_mime_type(data) == "image/png"


def test_detect_pdf():
    data = b"%PDF" + b"\x00" * 100
    assert detect_mime_type(data) == "application/pdf"


def test_detect_unknown():
    data = b"\x00\x00\x00\x00"
    assert detect_mime_type(data) is None


def test_validate_empty_file():
    with pytest.raises(ValidationError, match="empty"):
        validate_file(b"", "test.jpg")


def test_validate_unrecognized_format():
    with pytest.raises(ValidationError, match="Unrecognized"):
        validate_file(b"\x00\x00\x00\x00", "test.bin")
