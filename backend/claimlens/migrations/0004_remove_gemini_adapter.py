from django.db import migrations, models


def delete_gemini_engines(apps, schema_editor):
    """Delete all Gemini engine configs and clear their API keys."""
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute(
            'DELETE FROM claimlens_engineconfig WHERE adapter = %s',
            ['gemini'],
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('claimlens', '0003_seed_openrouter_engine'),
    ]

    operations = [
        migrations.RunPython(delete_gemini_engines, noop),
        migrations.AlterField(
            model_name='engineconfig',
            name='adapter',
            field=models.CharField(
                choices=[
                    ('openai_compatible', 'OpenAI Compatible'),
                    ('mistral', 'Mistral (legacy)'),
                    ('deepseek', 'DeepSeek (legacy)'),
                ],
                max_length=50,
            ),
        ),
    ]
