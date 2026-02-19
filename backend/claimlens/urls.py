from django.urls import path

from claimlens.views import upload_document, health_check, download_document

urlpatterns = [
    path('upload/', upload_document),
    path('health/', health_check),
    path('documents/<uuid:document_uuid>/download/', download_document),
]
