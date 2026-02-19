import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('claimlens', '0005_seed_validation_rules'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='EngineRoutingRule',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('is_deleted', models.BooleanField(db_column='isDeleted', default=False)),
                ('json_ext', models.JSONField(blank=True, db_column='JsonExt', default=dict)),
                ('date_created', models.DateTimeField(auto_now_add=True, db_column='DateCreated', null=True)),
                ('date_updated', models.DateTimeField(auto_now=True, db_column='DateUpdated', null=True)),
                ('version', models.IntegerField(default=1)),
                ('validity_from', models.DateTimeField(blank=True, db_column='ValidityFrom', null=True)),
                ('validity_to', models.DateTimeField(blank=True, db_column='ValidityTo', null=True)),
                ('name', models.CharField(max_length=255)),
                ('language', models.CharField(blank=True, help_text='Match language (null=any)', max_length=10, null=True)),
                ('min_confidence', models.FloatField(default=0.0, help_text='Only use this engine if its historical accuracy >= this value')),
                ('priority', models.IntegerField(default=50, help_text='Higher priority rules win. 100=override composite scoring.')),
                ('is_active', models.BooleanField(default=True)),
                ('document_type', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='routing_rules', to='claimlens.documenttype')),
                ('engine_config', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, related_name='routing_rules', to='claimlens.engineconfig')),
                ('user_created', models.ForeignKey(db_column='UserCreatedUUID', null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to=settings.AUTH_USER_MODEL)),
                ('user_updated', models.ForeignKey(db_column='UserUpdatedUUID', null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
