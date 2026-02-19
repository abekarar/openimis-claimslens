from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('claimlens', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='engineconfig',
            name='adapter',
            field=models.CharField(
                choices=[
                    ('openai_compatible', 'OpenAI Compatible'),
                    ('gemini', 'Gemini'),
                    ('mistral', 'Mistral (legacy)'),
                    ('deepseek', 'DeepSeek (legacy)'),
                ],
                max_length=50,
            ),
        ),
    ]
