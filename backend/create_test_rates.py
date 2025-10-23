"""
Script to create test parking rates for development/testing.
Run with: python create_test_rates.py
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import PricingRate
from decimal import Decimal

def create_test_rates():
    """Create test parking rates"""
    
    rates_data = [
        {
            'rate_name': '2-Wheeler Standard',
            'description': 'Standard hourly rate for bikes and scooters',
            'vehicle_type': '2-wheeler',
            'hourly_rate': Decimal('15.00'),
            'daily_rate': Decimal('200.00'),
            'is_active': True,
            'is_default': True
        },
        {
            'rate_name': '4-Wheeler Standard',
            'description': 'Standard hourly rate for cars',
            'vehicle_type': '4-wheeler',
            'hourly_rate': Decimal('30.00'),
            'daily_rate': Decimal('200.00'),
            'weekend_rate': Decimal('40.00'),
            'is_active': True,
            'is_default': True
        },
        {
            'rate_name': 'Electric Vehicle Special',
            'description': 'Includes free charging for electric vehicles',
            'vehicle_type': 'electric',
            'hourly_rate': Decimal('25.00'),
            'daily_rate': Decimal('180.00'),
            'is_active': True,
            'is_default': True
        },
        {
            'rate_name': 'Heavy Vehicle Rate',
            'description': 'For trucks and buses',
            'vehicle_type': 'heavy',
            'hourly_rate': Decimal('50.00'),
            'daily_rate': Decimal('350.00'),
            'is_active': True,
            'is_default': True
        },
        {
            'rate_name': 'SUV Premium',
            'description': 'Premium rate for SUVs',
            'vehicle_type': 'suv',
            'hourly_rate': Decimal('35.00'),
            'daily_rate': Decimal('250.00'),
            'weekend_rate': Decimal('45.00'),
            'is_active': True,
            'is_default': True
        },
    ]
    
    print("Creating test parking rates...\n")
    
    for rate_data in rates_data:
        rate, created = PricingRate.objects.get_or_create(
            rate_name=rate_data['rate_name'],
            defaults=rate_data
        )
        
        if created:
            print(f"✓ Created: {rate.rate_name}")
            print(f"  - Vehicle Type: {rate.get_vehicle_type_display()}")
            print(f"  - Hourly Rate: ₹{rate.hourly_rate}/hr")
            print(f"  - Daily Rate: ₹{rate.daily_rate}/day")
            if rate.weekend_rate:
                print(f"  - Weekend Rate: ₹{rate.weekend_rate}/hr")
            print(f"  - Default: {rate.is_default}")
            print(f"  - Active: {rate.is_active}\n")
        else:
            print(f"⚠ Already exists: {rate.rate_name}\n")
    
    total_rates = PricingRate.objects.count()
    active_rates = PricingRate.objects.filter(is_active=True).count()
    default_rates = PricingRate.objects.filter(is_default=True).count()
    
    print(f"\n{'='*50}")
    print(f"Summary:")
    print(f"  Total Rates: {total_rates}")
    print(f"  Active Rates: {active_rates}")
    print(f"  Default Rates: {default_rates}")
    print(f"{'='*50}\n")

if __name__ == '__main__':
    create_test_rates()
    print("✅ Test rates created successfully!")
