import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from claimlens.models import Document

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Document)
def document_post_save(sender, instance, created, **kwargs):
    """Dispatch parallel validation tasks when a document reaches 'completed' status."""
    if created:
        return
    if instance.status != Document.Status.COMPLETED:
        return

    # Retrieve the user who triggered the save from the kwargs
    # HistoryModel.save() stores it; we read it from the update_kwargs or raw_kwargs
    user_id = None
    update_fields = kwargs.get('update_fields')
    raw = kwargs.get('raw', False)
    if raw:
        return

    # Get user from the instance's saved-by tracking (HistoryModel sets user_updated)
    if hasattr(instance, 'user_updated') and instance.user_updated:
        user_id = str(instance.user_updated.id)
    elif hasattr(instance, 'user_created') and instance.user_created:
        user_id = str(instance.user_created.id)

    if not user_id:
        logger.warning("Cannot dispatch validation for document %s: no user context", instance.id)
        return

    try:
        from celery import group
        from claimlens.tasks import validate_upstream, validate_downstream

        validation_group = group(
            validate_upstream.signature(
                args=(str(instance.id), user_id),
                queue='claimlens.validation',
            ),
            validate_downstream.signature(
                args=(str(instance.id), user_id),
                queue='claimlens.validation',
            ),
        )
        validation_group.apply_async()
        logger.info("Dispatched parallel validation tasks for document %s", instance.id)

    except Exception as e:
        logger.error("Failed to dispatch validation tasks for document %s: %s", instance.id, e)
