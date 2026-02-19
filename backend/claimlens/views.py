import logging
import uuid as uuid_lib

from django.core.exceptions import PermissionDenied
from django.http import HttpResponse
from django.utils.translation import gettext as _
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.security import checkUserWithRights
from claimlens.apps import ClaimlensConfig
from claimlens.models import Document
from claimlens.services import DocumentService
from claimlens.storage import ClaimlensStorage

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([checkUserWithRights(ClaimlensConfig.gql_mutation_upload_document_perms)])
def upload_document(request):
    file = request.FILES.get('file')
    if not file:
        return Response({"success": False, "error": "No file provided"}, status=400)

    mime_type = file.content_type
    file_size = file.size
    original_filename = file.name

    allowed = ClaimlensConfig.allowed_mime_types
    if allowed and mime_type not in allowed:
        return Response(
            {"success": False, "error": f"Unsupported file type: {mime_type}"},
            status=400,
        )

    max_bytes = (ClaimlensConfig.max_file_size_mb or 20) * 1024 * 1024
    if file_size > max_bytes:
        return Response(
            {"success": False, "error": f"File too large. Max: {ClaimlensConfig.max_file_size_mb} MB"},
            status=400,
        )

    storage_key = f"documents/{uuid_lib.uuid4()}/{original_filename}"

    try:
        storage = ClaimlensStorage()
        storage.save(storage_key, file, content_type=mime_type)
    except Exception as e:
        logger.error("Failed to upload file to storage: %s", e)
        return Response(
            {"success": False, "error": "Failed to store file"},
            status=500,
        )

    service = DocumentService(request.user)
    result = service.upload({
        'original_filename': original_filename,
        'mime_type': mime_type,
        'file_size': file_size,
        'storage_key': storage_key,
    })

    if result.get('success'):
        return Response({
            "success": True,
            "document": result.get('data', {}),
        })
    else:
        storage.delete(storage_key)
        return Response(
            {"success": False, "error": result.get('detail', 'Upload failed')},
            status=500,
        )


@api_view(["GET"])
def health_check(request):
    results = {"status": "ok"}

    try:
        storage = ClaimlensStorage()
        results["storage"] = storage.health_check()
    except Exception:
        results["storage"] = False

    try:
        from claimlens.engine.manager import EngineManager
        manager = EngineManager()
        results["engines"] = manager.health_check()
    except Exception:
        results["engines"] = {}

    overall = results.get("storage", False) and any(results.get("engines", {}).values())
    results["status"] = "ok" if overall else "degraded"

    return Response(results)


@api_view(["GET"])
@permission_classes([checkUserWithRights(ClaimlensConfig.gql_query_documents_perms)])
def download_document(request, document_uuid):
    try:
        doc = Document.objects.get(uuid=document_uuid)
    except Document.DoesNotExist:
        return Response({"error": "Document not found"}, status=404)

    storage = ClaimlensStorage()
    try:
        data = storage.read(doc.storage_key)
    except Exception as e:
        logger.error("Failed to read document %s from storage: %s", document_uuid, e)
        return Response({"error": "Failed to retrieve document"}, status=500)

    response = HttpResponse(data, content_type=doc.mime_type)
    response["Content-Disposition"] = f'inline; filename="{doc.original_filename}"'
    response["Cache-Control"] = "private, max-age=3600"
    return response
