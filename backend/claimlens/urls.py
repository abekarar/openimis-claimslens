from django.urls import path

from claimlens.views import upload_document, health_check

urlpatterns = [
    path('upload/', upload_document),
    path('health/', health_check),
]
