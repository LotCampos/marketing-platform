from decimal import Decimal
from django.db import migrations, models
import django.db.models.deletion
import uuid6


class Migration(migrations.Migration):

    dependencies = [
        ('commercial', '0015_alter_quotationitem_quantity_and_more'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
        migrations.CreateModel(
            name='CommercialClauseTemplate',
            fields=[
                ('id', models.UUIDField(default=uuid6.uuid7, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('code', models.CharField(db_column='code', max_length=100)),
                ('name', models.CharField(db_column='name', max_length=200)),
                ('version', models.PositiveIntegerField(db_column='version')),
                ('treatment', models.CharField(db_column='treatment', max_length=30)),
                ('template_text', models.TextField(db_column='template_text')),
                ('is_active', models.BooleanField(db_column='is_active', default=True)),
                ('effective_from', models.DateTimeField(db_column='effective_from')),
                ('effective_until', models.DateTimeField(blank=True, db_column='effective_until', null=True)),
                ('content_hash', models.CharField(db_column='content_hash', max_length=64)),
                ('created_by', models.UUIDField(blank=True, db_column='created_by', null=True)),
            ],
            options={
                'db_table': 'commercial_clause_templates',
            },
        ),
        migrations.CreateModel(
            name='CommercialComponentType',
            fields=[
                ('id', models.UUIDField(default=uuid6.uuid7, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('code', models.CharField(db_column='code', max_length=50)),
                ('name', models.CharField(db_column='name', max_length=150)),
                ('description', models.TextField(blank=True, db_column='description', null=True)),
                ('is_active', models.BooleanField(db_column='is_active', default=True)),
            ],
            options={
                'db_table': 'commercial_component_types',
            },
        ),
        migrations.CreateModel(
            name='QuotationComponent',
            fields=[
                ('id', models.UUIDField(default=uuid6.uuid7, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('version_lock', models.PositiveIntegerField(db_column='version_lock', default=1)),
                ('quotation_id', models.UUIDField(db_column='quotation_id')),
                ('treatment', models.CharField(db_column='treatment', max_length=30)),
                ('amount', models.DecimalField(db_column='amount', decimal_places=2, default=Decimal('0'), max_digits=14)),
                ('display_mode', models.CharField(db_column='display_mode', max_length=30)),
                ('clause_version', models.PositiveIntegerField(blank=True, db_column='clause_version', null=True)),
                ('clause_text_snapshot', models.TextField(blank=True, db_column='clause_text_snapshot', null=True)),
                ('clause_template', models.ForeignKey(blank=True, db_column='clause_template_id', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='quotation_components', to='commercial.commercialclausetemplate')),
                ('component_type', models.ForeignKey(db_column='component_type_id', on_delete=django.db.models.deletion.PROTECT, related_name='quotation_components', to='commercial.commercialcomponenttype')),
            ],
            options={
                'db_table': 'quotation_components',
            },
        ),
        migrations.AddConstraint(
            model_name='commercialcomponenttype',
            constraint=models.UniqueConstraint(fields=('code',), name='commercial_component_types_code_uk'),
        ),
        migrations.AddField(
            model_name='commercialclausetemplate',
            name='component_type',
            field=models.ForeignKey(db_column='component_type_id', on_delete=django.db.models.deletion.PROTECT, related_name='clause_templates', to='commercial.commercialcomponenttype'),
        ),
        migrations.AddConstraint(
            model_name='quotationcomponent',
            constraint=models.CheckConstraint(check=models.Q(('treatment__in', ['INCLUDED', 'ADDITIONAL', 'INFORMATIVE'])), name='quotation_components_treatment_ck'),
        ),
        migrations.AddConstraint(
            model_name='quotationcomponent',
            constraint=models.CheckConstraint(check=models.Q(('display_mode__in', ['LINE_ITEM', 'CLAUSE', 'HIDDEN'])), name='quotation_components_display_mode_ck'),
        ),
        migrations.AddConstraint(
            model_name='quotationcomponent',
            constraint=models.CheckConstraint(check=models.Q(('amount__gte', 0)), name='quotation_components_amount_ck'),
        ),
        migrations.AddConstraint(
            model_name='quotationcomponent',
            constraint=models.CheckConstraint(check=models.Q(models.Q(('clause_template__isnull', False), ('clause_text_snapshot__isnull', False), ('clause_version__isnull', False), ('display_mode', 'CLAUSE')), models.Q(('display_mode', 'CLAUSE'), _negated=True), _connector='OR'), name='quotation_components_clause_consistency_ck'),
        ),
        migrations.AddConstraint(
            model_name='commercialclausetemplate',
            constraint=models.UniqueConstraint(fields=('code', 'version'), name='commercial_clause_templates_code_version_uk'),
        ),
        migrations.AddConstraint(
            model_name='commercialclausetemplate',
            constraint=models.CheckConstraint(check=models.Q(('treatment__in', ['INCLUDED', 'ADDITIONAL', 'INFORMATIVE'])), name='commercial_clause_templates_treatment_ck'),
        ),
        migrations.AddConstraint(
            model_name='commercialclausetemplate',
            constraint=models.CheckConstraint(check=models.Q(('version__gte', 1)), name='commercial_clause_templates_version_ck'),
        ),
            ],
        ),
    ]
