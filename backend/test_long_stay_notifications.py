"""
Test script to verify long-stay detection notifications
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from api.models import Booking, User, Vehicle, ParkingSlot, ParkingLot, Notification
from api.long_stay_detection import get_long_stay_service

def create_test_scenario():
    """Create test bookings for notification testing"""
    print("\n" + "="*60)
    print("CREATING TEST SCENARIO FOR LONG-STAY NOTIFICATIONS")
    print("="*60)
    
    # Get or create admin user
    admin, _ = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@parkmatrix.com',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if _:
        admin.set_password('admin123')
        admin.save()
    
    # Get or create test customer
    customer, _ = User.objects.get_or_create(
        username='test_customer',
        defaults={
            'email': 'customer@test.com',
            'role': 'customer'
        }
    )
    if _:
        customer.set_password('test123')
        customer.save()
    
    # Get parking lot and slot
    parking_lot = ParkingLot.objects.first()
    if not parking_lot:
        print("❌ No parking lot found! Please create one first.")
        return
    
    slot = ParkingSlot.objects.filter(is_occupied=False).first()
    if not slot:
        print("❌ No available parking slot found!")
        return
    
    # Get or create vehicle
    vehicle, _ = Vehicle.objects.get_or_create(
        user=customer,
        number_plate='TEST-LONG-STAY',
        defaults={'vehicle_type': 'car'}
    )
    
    # Clear old notifications
    old_notif_count = Notification.objects.filter(
        user__in=[customer, admin]
    ).count()
    
    print(f"\n📧 Found {old_notif_count} existing notifications")
    print("   (These will help verify notification delivery)")
    
    # Scenario 1: Create a critical long-stay booking (>24 hours)
    print("\n🚨 Creating CRITICAL long-stay booking (26 hours parked)...")
    
    now = timezone.now()
    critical_booking = Booking.objects.create(
        user=customer,
        vehicle=vehicle,
        slot=slot,
        start_time=now - timedelta(hours=27),
        end_time=now - timedelta(hours=2),
        checked_in_at=now - timedelta(hours=26),
        status='checked_in',
        total_price=100.00
    )
    
    slot.is_occupied = True
    slot.save()
    
    print(f"   ✅ Created booking #{critical_booking.id}")
    print(f"   📍 Slot: {slot.slot_number} - {slot.parking_zone}")
    print(f"   ⏰ Checked in: 26 hours ago")
    print(f"   ⚠️ Expected: CRITICAL notifications for customer & admins")
    
    # Scenario 2: Create a warning booking (20 hours parked)
    slot2 = ParkingSlot.objects.filter(is_occupied=False).first()
    if slot2:
        print("\n⚡ Creating WARNING long-stay booking (20 hours parked)...")
        
        warning_booking = Booking.objects.create(
            user=customer,
            vehicle=vehicle,
            slot=slot2,
            start_time=now - timedelta(hours=21),
            end_time=now + timedelta(hours=3),
            checked_in_at=now - timedelta(hours=20),
            status='checked_in',
            total_price=100.00
        )
        
        slot2.is_occupied = True
        slot2.save()
        
        print(f"   ✅ Created booking #{warning_booking.id}")
        print(f"   📍 Slot: {slot2.slot_number} - {slot2.parking_zone}")
        print(f"   ⏰ Checked in: 20 hours ago")
        print(f"   ⚠️ Expected: WARNING notifications for customer & admins")
    
    return critical_booking, admin, customer


def test_notifications():
    """Test the long-stay detection and notification system"""
    print("\n" + "="*60)
    print("TESTING LONG-STAY DETECTION & NOTIFICATIONS")
    print("="*60)
    
    # Create test scenario
    test_data = create_test_scenario()
    if not test_data:
        return
    
    critical_booking, admin, customer = test_data
    
    # Count notifications before detection
    customer_notifs_before = Notification.objects.filter(user=customer).count()
    admin_notifs_before = Notification.objects.filter(user=admin).count()
    
    print(f"\n📊 Notifications before detection:")
    print(f"   Customer: {customer_notifs_before}")
    print(f"   Admin: {admin_notifs_before}")
    
    # Run long-stay detection
    print("\n🔍 Running long-stay detection...")
    service = get_long_stay_service()
    results = service.detect_long_stay_vehicles()
    
    # Display results
    print("\n" + "="*60)
    print("DETECTION RESULTS")
    print("="*60)
    print(f"\n🚨 Critical vehicles: {results['summary']['critical_count']}")
    print(f"⚡ Warning vehicles: {results['summary']['warning_count']}")
    print(f"✅ Normal vehicles: {results['summary']['normal_count']}")
    
    # Display critical vehicles
    if results['long_stay_vehicles']:
        print("\n🚨 CRITICAL LONG-STAY VEHICLES:")
        for v in results['long_stay_vehicles']:
            print(f"\n   Vehicle: {v['vehicle']['plate']}")
            print(f"   Slot: {v['slot']['number']} - {v['slot']['parking_lot']}")
            print(f"   Duration: {v['timing']['current_duration_formatted']}")
            print(f"   Overtime: {v['overtime_hours']:.1f} hours")
            print(f"   Owner: {v['user']['username']} ({v['user']['email']})")
    
    # Display warning vehicles
    if results['warning_vehicles']:
        print("\n⚡ WARNING VEHICLES:")
        for v in results['warning_vehicles']:
            hours_remaining = 24 - v['timing']['current_duration_hours']
            print(f"\n   Vehicle: {v['vehicle']['plate']}")
            print(f"   Slot: {v['slot']['number']}")
            print(f"   Duration: {v['timing']['current_duration_formatted']}")
            print(f"   Time remaining: {hours_remaining:.1f} hours")
    
    # Check notifications after detection
    print("\n" + "="*60)
    print("NOTIFICATION VERIFICATION")
    print("="*60)
    
    customer_notifs_after = Notification.objects.filter(user=customer).count()
    admin_notifs_after = Notification.objects.filter(user=admin).count()
    
    customer_new = customer_notifs_after - customer_notifs_before
    admin_new = admin_notifs_after - admin_notifs_before
    
    print(f"\n📧 New notifications created:")
    print(f"   Customer: {customer_new} new notification(s)")
    print(f"   Admin: {admin_new} new notification(s)")
    
    # Display customer notifications
    if customer_new > 0:
        print("\n📱 CUSTOMER NOTIFICATIONS:")
        customer_notifications = Notification.objects.filter(
            user=customer
        ).order_by('-created_at')[:customer_new]
        
        for idx, notif in enumerate(customer_notifications, 1):
            print(f"\n   {idx}. {notif.title}")
            print(f"      Type: {notif.notification_type}")
            print(f"      Priority: {notif.additional_data.get('priority', 'N/A')}")
            print(f"      Alert Type: {notif.additional_data.get('alert_type', 'N/A')}")
            print(f"      Message Preview: {notif.message[:100]}...")
    
    # Display admin notifications
    if admin_new > 0:
        print("\n👨‍💼 ADMIN NOTIFICATIONS:")
        admin_notifications = Notification.objects.filter(
            user=admin
        ).order_by('-created_at')[:admin_new]
        
        for idx, notif in enumerate(admin_notifications, 1):
            print(f"\n   {idx}. {notif.title}")
            print(f"      Type: {notif.notification_type}")
            print(f"      Priority: {notif.additional_data.get('priority', 'N/A')}")
            print(f"      Alert Type: {notif.additional_data.get('alert_type', 'N/A')}")
            if notif.additional_data.get('alert_type') == 'long_stay_critical_admin':
                print(f"      Booking: #{notif.additional_data.get('booking_id')}")
                print(f"      Vehicle: {notif.additional_data.get('vehicle_plate')}")
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    success = True
    
    if results['summary']['critical_count'] > 0:
        print("✅ Critical vehicles detected successfully")
    else:
        print("❌ No critical vehicles detected (expected at least 1)")
        success = False
    
    if customer_new >= 1:
        print("✅ Customer notifications sent successfully")
    else:
        print("❌ Customer notifications not sent")
        success = False
    
    if admin_new >= 2:  # Should get individual alert + summary
        print("✅ Admin notifications sent successfully")
    else:
        print(f"⚠️  Admin got {admin_new} notifications (expected at least 2)")
    
    if success:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print("\n⚠️  SOME TESTS FAILED - Check logs above")
    
    print("\n" + "="*60)


if __name__ == '__main__':
    try:
        test_notifications()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
