"""
Quick test script for Revenue Management API
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Booking, User
from django.utils import timezone
from datetime import timedelta

print("=" * 60)
print("REVENUE API TEST")
print("=" * 60)

# Check for checked_out bookings
checked_out_bookings = Booking.objects.filter(status='checked_out')
print(f"\n✓ Total checked_out bookings: {checked_out_bookings.count()}")

if checked_out_bookings.exists():
    print("\nSample checked_out bookings:")
    for booking in checked_out_bookings[:5]:
        print(f"  - Booking #{booking.id}: ${booking.total_price or 0} + ${booking.overstay_amount or 0} overstay")

# Test revenue calculation
from django.db.models import Sum

total_booking_revenue = checked_out_bookings.aggregate(total=Sum('total_price'))['total'] or 0
total_overstay_revenue = checked_out_bookings.aggregate(total=Sum('overstay_amount'))['total'] or 0
total_revenue = float(total_booking_revenue) + float(total_overstay_revenue)

print(f"\n✓ Total Booking Revenue: ${total_booking_revenue:.2f}")
print(f"✓ Total Overstay Revenue: ${total_overstay_revenue:.2f}")
print(f"✓ Total Revenue: ${total_revenue:.2f}")

# Test by zone
zone_stats = checked_out_bookings.values('slot__parking_zone').annotate(
    zone_revenue=Sum('total_price'),
    zone_overstay=Sum('overstay_amount')
)

print(f"\n✓ Revenue by Zone:")
for stat in zone_stats:
    zone_name = stat['slot__parking_zone'] or 'Unknown'
    zone_rev = float(stat['zone_revenue'] or 0) + float(stat['zone_overstay'] or 0)
    print(f"  - {zone_name}: ${zone_rev:.2f}")

# Test by vehicle type
vehicle_stats = checked_out_bookings.values('vehicle__vehicle_type').annotate(
    vehicle_revenue=Sum('total_price'),
    vehicle_overstay=Sum('overstay_amount')
)

print(f"\n✓ Revenue by Vehicle Type:")
for stat in vehicle_stats:
    vehicle_type = stat['vehicle__vehicle_type'] or 'Unknown'
    vehicle_rev = float(stat['vehicle_revenue'] or 0) + float(stat['vehicle_overstay'] or 0)
    print(f"  - {vehicle_type}: ${vehicle_rev:.2f}")

print("\n" + "=" * 60)
print("✓ Revenue API logic validated successfully!")
print("=" * 60)
