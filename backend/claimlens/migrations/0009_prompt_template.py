import os
import uuid

import django.db.models.deletion
from django.db import migrations, models


CLASSIFICATION_PROMPT = """You are a document classification system. Analyze the provided document image and classify it into one of the following document types:

{types_text}

Respond with a JSON object containing:
- "document_type_code": the code of the matching document type
- "confidence": a float between 0 and 1 indicating classification confidence
- "language": ISO 639-1 language code of the document (e.g. "en", "fr", "sw")
- "reasoning": brief explanation of why this classification was chosen

Respond ONLY with valid JSON, no additional text."""

EXTRACTION_PROMPT = """You are a document data extraction system. Extract structured data from the provided document image according to this template:

{fields_text}

For each field, provide:
- The extracted value
- A confidence score between 0 and 1
{array_instructions}
Respond with a JSON object containing:
- "fields": object mapping field names to {{"value": ..., "confidence": float}}
- "aggregate_confidence": overall extraction confidence (float 0-1)

Respond ONLY with valid JSON, no additional text."""


def seed_global_prompts(apps, schema_editor):
    """Seed global v1 prompts from existing .md file content."""
    cursor = schema_editor.connection.cursor()

    # Try to read from actual files first; fall back to hardcoded content
    prompts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'engine', 'prompts')
    for prompt_type, fallback_content in [
        ('classification', CLASSIFICATION_PROMPT),
        ('extraction', EXTRACTION_PROMPT),
    ]:
        file_path = os.path.join(prompts_dir, f'{prompt_type}.md')
        try:
            with open(file_path, 'r') as f:
                content = f.read()
        except (IOError, OSError):
            content = fallback_content

        cursor.execute('''
            INSERT INTO claimlens_prompttemplate
            ("UUID", "isDeleted", "Json_ext", "DateCreated", "DateUpdated",
             version, prompt_type, content, document_type_id, is_active,
             change_summary,
             "UserCreatedUUID", "UserUpdatedUUID")
            SELECT %s, FALSE, '{}', NOW(), NOW(),
             1, %s, %s, NULL, TRUE,
             'Initial seed from file',
             (SELECT id FROM "core_User" LIMIT 1),
             (SELECT id FROM "core_User" LIMIT 1)
            WHERE NOT EXISTS (
                SELECT 1 FROM claimlens_prompttemplate
                WHERE prompt_type = %s AND document_type_id IS NULL AND version = 1
            )
        ''', [str(uuid.uuid4()), prompt_type, content, prompt_type])


def reverse_seed(apps, schema_editor):
    cursor = schema_editor.connection.cursor()
    cursor.execute(
        "DELETE FROM claimlens_prompttemplate WHERE document_type_id IS NULL AND version = 1"
    )


class Migration(migrations.Migration):

    dependencies = [
        ("claimlens", "0008_update_extraction_templates"),
    ]

    operations = [
        # Fix migration state: HistoryModel metaclass forces PK column to "UUID"
        # but migration 0001 declared it without db_column. This state-only fix
        # aligns the migration state with the actual DB schema so FK references
        # in CreateModel below resolve correctly.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name="documenttype",
                    name="id",
                    field=models.UUIDField(
                        db_column="UUID",
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
            ],
            database_operations=[],
        ),
        migrations.CreateModel(
            name="PromptTemplate",
            fields=[
                ("id", models.UUIDField(db_column="UUID", default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("is_deleted", models.BooleanField(db_column="isDeleted", default=False)),
                ("json_ext", models.JSONField(db_column="Json_ext", default=dict, blank=True)),
                ("date_created", models.DateTimeField(db_column="DateCreated", auto_now_add=True, null=True)),
                ("date_updated", models.DateTimeField(db_column="DateUpdated", auto_now=True, null=True)),
                ("user_created", models.ForeignKey(db_column="UserCreatedUUID", on_delete=django.db.models.deletion.DO_NOTHING, related_name="+", to="core.user", null=True, blank=True)),
                ("user_updated", models.ForeignKey(db_column="UserUpdatedUUID", on_delete=django.db.models.deletion.DO_NOTHING, related_name="+", to="core.user", null=True, blank=True)),
                ("version", models.IntegerField(default=1)),
                ("prompt_type", models.CharField(choices=[("classification", "Classification"), ("extraction", "Extraction")], max_length=20)),
                ("content", models.TextField()),
                ("document_type", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name="prompt_overrides", to="claimlens.documenttype")),
                ("is_active", models.BooleanField(default=False)),
                ("change_summary", models.CharField(blank=True, default="", max_length=255)),
            ],
            options={
                "ordering": ["-version"],
                "unique_together": {("prompt_type", "document_type", "version")},
            },
        ),
        migrations.RunPython(seed_global_prompts, reverse_seed),
    ]
