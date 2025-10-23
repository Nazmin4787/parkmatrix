"""
Script to create initial zone pricing rates for all parking zones
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parkingproject.settings')
django.setup()

from api.models import ZonePricingRate, User
from django.utils import timezone

def create_initial_zone_rates():
    """Create default pricing rates for all zones and vehicle types"""
    
    # Get an admin user to assign as creator (use first superuser)
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        print("⚠️  No admin user found. Please create a superuser first.")
        return
    
    # Define initial rates for each zone
    zone_rates = {
        'COLLEGE_PARKING_CENTER': {
            'car': {'hourly': 15.00, 'daily': 100.00, 'weekend': 12.00},
            'bike': {'hourly': 8.00, 'daily': 50.00, 'weekend': 6.00},
            'suv': {'hourly': 20.00, 'daily': 140.00, 'weekend': 18.00},
            'truck': {'hourly': 25.00, 'daily': 180.00, 'weekend': 22.00},
        },
        'HOME_PARKING_CENTER': {
            'car': {'hourly': 10.00, 'daily': 70.00, 'weekend': 8.00},
            'bike': {'hourly': 5.00, 'daily': 30.00, 'weekend': 4.00},
            'suv': {'hourly': 15.00, 'daily': 100.00, 'weekend': 12.00},
            'truck': {'hourly': 18.00, 'daily': 120.00, 'weekend': 15.00},
        },
        'METRO_PARKING_CENTER': {
            'car': {'hourly': 30.00, 'daily': 200.00, 'weekend': 25.00},
            'bike': {'hourly': 15.00, 'daily': 100.00, 'weekend': 12.00},
            'suv': {'hourly': 40.00, 'daily': 280.00, 'weekend': 35.00},
            'truck': {'hourly': 50.00, 'daily': 350.00, 'weekend': 45.00},
        },
        'VIVIVANA_PARKING_CENTER': {
            'car': {'hourly': 20.00, 'daily': 140.00, 'weekend': 18.00},
            'bike': {'hourly': 10.00, 'daily': 70.00, 'weekend': 8.00},
            'suv': {'hourly': 25.00, 'daily': 180.00, 'weekend': 22.00},
            'truck': {'hourly': 30.00, 'daily': 210.00, 'weekend': 27.00},
        },
    }
    
    zone_names = {
        'COLLEGE_PARKING_CENTER': 'College',
        'HOME_PARKING_CENTER': 'Home',
        'METRO_PARKING_CENTER': 'Metro',
        'VIVIVANA_PARKING_CENTER': 'Vivivana',
    }
    
    vehicle_names = {
        'car': 'Car',
        'bike': 'Bike',
        'suv': 'SUV',
        'truck': 'Truck',
    }
    
    created_count = 0
    updated_count = 0
    
    print("\n" + "="*70)
    print("🚗 ZONE PRICING RATE INITIALIZATION")
    print("="*70 + "\n")
    
    for zone_code, vehicle_rates in zone_rates.items():
        zone_name = zone_names[zone_code]
        print(f"📍 {zone_name} Parking Center ({zone_code})")
        print("-" * 70)
        
        for vehicle_type, rates in vehicle_rates.items():
            # Check if rate already exists
            existing_rate = ZonePricingRate.objects.filter(
                parking_zone=zone_code,
                vehicle_type=vehicle_type,
                is_active=True
            ).first()
            
            rate_name = f"{zone_name} {vehicle_names[vehicle_type]} Rate"
            description = f"Standard parking rate for {vehicle_names[vehicle_type].lower()} vehicles at {zone_name} Parking Center"
            
            if existing_rate:
                # Update existing rate
                existing_rate.rate_name = rate_name
                existing_rate.description = description
                existing_rate.hourly_rate = rates['hourly']
                existing_rate.daily_rate = rates['daily']
                existing_rate.weekend_rate = rates['weekend']
                existing_rate.save()
                
                print(f"   ✓ Updated {vehicle_names[vehicle_type]}: ₹{rates['hourly']}/hr, ₹{rates['daily']}/day (Weekend: ₹{rates['weekend']}/hr)")
                updated_count += 1
            else:
                # Create new rate
                ZonePricingRate.objects.create(
                    parking_zone=zone_code,
                    vehicle_type=vehicle_type,
                    rate_name=rate_name,
                    description=description,
                    hourly_rate=rates['hourly'],
                    daily_rate=rates['daily'],
                    weekend_rate=rates['weekend'],
                    is_active=True,
                    effective_from=timezone.now(),
                    created_by=admin_user
                )
                
                print(f"   ✓ Created {vehicle_names[vehicle_type]}: ₹{rates['hourly']}/hr, ₹{rates['daily']}/day (Weekend: ₹{rates['weekend']}/hr)")
                created_count += 1
        
        print()
    
    print("="*70)
    print(f"✅ Initialization Complete!")
    print(f"   • Created: {created_count} new rates")
    print(f"   • Updated: {updated_count} existing rates")
    print(f"   • Total: {created_count + updated_count} zone pricing rates")
    print("="*70 + "\n")

if __name__ == '__main__':
    create_initial_zone_rates()
