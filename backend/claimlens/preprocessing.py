import logging
from io import BytesIO

logger = logging.getLogger(__name__)


def analyze_image(file_bytes, mime_type):
    metadata = {
        'file_size': len(file_bytes),
        'mime_type': mime_type,
    }

    if mime_type in ('image/jpeg', 'image/png', 'image/tiff', 'image/webp'):
        metadata.update(_analyze_image_file(file_bytes))
    elif mime_type == 'application/pdf':
        metadata.update(_analyze_pdf_file(file_bytes))

    return metadata


def _analyze_image_file(file_bytes):
    result = {}
    try:
        from PIL import Image
        img = Image.open(BytesIO(file_bytes))
        result['width'] = img.width
        result['height'] = img.height
        result['mode'] = img.mode
        result['format'] = img.format

        dpi = img.info.get('dpi')
        if dpi:
            result['dpi_x'] = dpi[0]
            result['dpi_y'] = dpi[1]
        else:
            result['dpi_x'] = 72
            result['dpi_y'] = 72

        result['quality_score'] = _compute_quality_score(
            result.get('dpi_x', 72), img.width, img.height
        )
    except Exception as e:
        logger.warning("Image analysis failed: %s", e)
        result['analysis_error'] = str(e)

    return result


def _analyze_pdf_file(file_bytes):
    result = {'format': 'PDF'}
    try:
        from PIL import Image
        img = Image.open(BytesIO(file_bytes))
        result['width'] = img.width
        result['height'] = img.height
    except Exception:
        pass

    result['page_count'] = _get_pdf_page_count(file_bytes)
    return result


def _get_pdf_page_count(file_bytes):
    try:
        content = file_bytes if isinstance(file_bytes, bytes) else file_bytes.read()
        return content.count(b'/Type /Page') - content.count(b'/Type /Pages')
    except Exception:
        return 1


def _compute_quality_score(dpi, width, height):
    score = 0.0
    if dpi >= 300:
        score += 0.5
    elif dpi >= 200:
        score += 0.35
    elif dpi >= 150:
        score += 0.2
    else:
        score += 0.1

    pixel_count = width * height
    if pixel_count >= 2_000_000:
        score += 0.5
    elif pixel_count >= 1_000_000:
        score += 0.35
    elif pixel_count >= 500_000:
        score += 0.2
    else:
        score += 0.1

    return round(min(score, 1.0), 2)
