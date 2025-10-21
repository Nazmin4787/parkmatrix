import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User, AuditLog, Booking

print("="*60)
print("DATABASE CHECK")
print("="*60)
print(f"Total Users: {User.objects.count()}")
print(f"Admin Users: {User.objects.filter(role='admin').count()}")
print(f"Security Users: {User.objects.filter(role='security').count()}")
print(f"Customer Users: {User.objects.filter(role='customer').count()}")
print()
print(f"Total Bookings: {Booking.objects.count()}")
print(f"Total Audit Logs: {AuditLog.objects.count()}")
print()

# Show admin users
print("Admin Users:")
for user in User.objects.filter(role='admin')[:5]:
    print(f"  - {user.username} ({user.email})")

# Show check-in/check-out logs
checkin_logs = AuditLog.objects.filter(
    action__in=['check_in_success', 'check_in_failed', 
                'check_out_success', 'check_out_failed']
).count()
print(f"\nCheck-In/Check-Out Logs: {checkin_logs}")

if checkin_logs > 0:
    print("\nRecent Check-In/Check-Out Activity:")
    for log in AuditLog.objects.filter(
        action__in=['check_in_success', 'check_in_failed', 
                   'check_out_success', 'check_out_failed']
    ).order_by('-timestamp')[:5]:
        print(f"  - {log.action}: {log.timestamp}")

print("="*60)
