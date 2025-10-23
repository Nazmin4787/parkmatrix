# Generated manually for parking rate enhancements

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_accesslog'),
    ]

    operations = [
        # Add description field
        migrations.AddField(
            model_name='pricingrate',
            name='description',
            field=models.TextField(blank=True, help_text='Description of the rate plan'),
        ),
        
        # Add weekend_rate field
        migrations.AddField(
            model_name='pricingrate',
            name='weekend_rate',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Special hourly rate for weekends (Sat/Sun) in ₹',
                max_digits=6,
                null=True
            ),
        ),
        
        # Add holiday_rate field
        migrations.AddField(
            model_name='pricingrate',
            name='holiday_rate',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Special hourly rate for public holidays in ₹',
                max_digits=6,
                null=True
            ),
        ),
        
        # Add time_slot_start field
        migrations.AddField(
            model_name='pricingrate',
            name='time_slot_start',
            field=models.TimeField(
                blank=True,
                help_text='Start time for special rate (e.g., 18:00 for evening)',
                null=True
            ),
        ),
        
        # Add time_slot_end field
        migrations.AddField(
            model_name='pricingrate',
            name='time_slot_end',
            field=models.TimeField(
                blank=True,
                help_text='End time for special rate (e.g., 06:00 for morning)',
                null=True
            ),
        ),
        
        # Add special_rate field
        migrations.AddField(
            model_name='pricingrate',
            name='special_rate',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Special hourly rate for specific time slot in ₹',
                max_digits=6,
                null=True
            ),
        ),
        
        # Add is_active field
        migrations.AddField(
            model_name='pricingrate',
            name='is_active',
            field=models.BooleanField(
                default=True,
                help_text='Whether this rate is currently active'
            ),
        ),
        
        # Add created_at field
        migrations.AddField(
            model_name='pricingrate',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        
        # Add updated_at field
        migrations.AddField(
            model_name='pricingrate',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        
        # Update vehicle_type choices to include new types
        migrations.AlterField(
            model_name='pricingrate',
            name='vehicle_type',
            field=models.CharField(
                choices=[
                    ('all', 'All Vehicles'),
                    ('2-wheeler', '2-Wheeler (Bike/Scooter)'),
                    ('4-wheeler', '4-Wheeler (Car/Sedan)'),
                    ('suv', 'SUV'),
                    ('electric', 'Electric Vehicle'),
                    ('heavy', 'Heavy Vehicle (Truck/Bus)'),
                    ('car', 'Car'),
                    ('bike', 'Bike'),
                ],
                default='all',
                help_text='Type of vehicle this rate applies to',
                max_length=15
            ),
        ),
        
        # Update rate_name with help text
        migrations.AlterField(
            model_name='pricingrate',
            name='rate_name',
            field=models.CharField(
                help_text='Name of the rate plan',
                max_length=100,
                unique=True
            ),
        ),
        
        # Update hourly_rate with help text
        migrations.AlterField(
            model_name='pricingrate',
            name='hourly_rate',
            field=models.DecimalField(
                decimal_places=2,
                help_text='Rate per hour in ₹',
                max_digits=6
            ),
        ),
        
        # Update daily_rate with help text
        migrations.AlterField(
            model_name='pricingrate',
            name='daily_rate',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Flat rate for full day (24 hours) in ₹',
                max_digits=8,
                null=True
            ),
        ),
        
        # Update extension_rate_multiplier with help text
        migrations.AlterField(
            model_name='pricingrate',
            name='extension_rate_multiplier',
            field=models.DecimalField(
                decimal_places=2,
                default=1.0,
                help_text='Multiplier for overtime/extension charges',
                max_digits=4
            ),
        ),
        
        # Update is_default with help text
        migrations.AlterField(
            model_name='pricingrate',
            name='is_default',
            field=models.BooleanField(
                default=False,
                help_text='Whether this is the default rate for the vehicle type'
            ),
        ),
        
        # Update effective_from with help text
        migrations.AlterField(
            model_name='pricingrate',
            name='effective_from',
            field=models.DateTimeField(
                blank=True,
                help_text='Date/time when this rate becomes effective',
                null=True
            ),
        ),
        
        # Update effective_to with help text
        migrations.AlterField(
            model_name='pricingrate',
            name='effective_to',
            field=models.DateTimeField(
                blank=True,
                help_text='Date/time when this rate expires',
                null=True
            ),
        ),
    ]
