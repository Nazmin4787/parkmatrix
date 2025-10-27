"""
Long-Stay Vehicle Detection Service
Automatically detects vehicles parked beyond allowed duration and alerts admins
"""
from django.utils import timezone
from django.db.models import F, ExpressionWrapper, DurationField
from datetime import timedelta
from .models import Booking, Notification, User, AuditLog
import logging

logger = logging.getLogger(__name__)

# Configuration
LONG_STAY_THRESHOLD_HOURS = 24  # Default threshold
WARNING_THRESHOLD_HOURS = 20    # Early warning before long-stay


class LongStayDetectionService:
    """Service to detect and manage long-stay vehicles"""
    
    def __init__(self, threshold_hours=LONG_STAY_THRESHOLD_HOURS):
        self.threshold_hours = threshold_hours
        self.threshold_timedelta = timedelta(hours=threshold_hours)
    
    def detect_long_stay_vehicles(self):
        """
        Main function to detect vehicles that have been parked beyond allowed duration.
        Returns a list of long-stay vehicles with relevant details.
        """
        logger.info(f"Running long-stay detection (threshold: {self.threshold_hours}h)")
        
        now = timezone.now()
        cutoff_time = now - self.threshold_timedelta
        
        # Get all currently parked vehicles (checked in but not checked out)
        currently_parked = Booking.objects.filter(
            status='checked_in',
            checked_in_at__isnull=False,
            checked_out_at__isnull=True
        ).select_related(
            'user', 'vehicle', 'slot', 'slot__parking_lot'
        )
        
        long_stay_vehicles = []
        warning_vehicles = []
        
        for booking in currently_parked:
            # Calculate how long the vehicle has been parked
            parking_duration = now - booking.checked_in_at
            hours_parked = parking_duration.total_seconds() / 3600
            
            vehicle_info = {
                'booking_id': booking.id,
                'user': {
                    'id': booking.user.id,
                    'username': booking.user.username,
                    'email': booking.user.email,
                },
                'vehicle': {
                    'plate': booking.vehicle.number_plate if booking.vehicle else 'N/A',
                    'type': booking.vehicle.vehicle_type if booking.vehicle else 'N/A',
                    'model': booking.vehicle.model if booking.vehicle else 'N/A',
                },
                'slot': {
                    'number': booking.slot.slot_number,
                    'floor': booking.slot.floor,
                    'section': booking.slot.section,
                    'parking_lot': booking.slot.parking_lot.name if booking.slot.parking_lot else 'Unknown',
                },
                'timing': {
                    'checked_in_at': booking.checked_in_at,
                    'expected_checkout': booking.end_time,
                    'current_duration_hours': round(hours_parked, 2),
                    'current_duration_formatted': self._format_duration(parking_duration),
                },
                'is_overtime': now > booking.end_time,
                'overtime_hours': round((now - booking.end_time).total_seconds() / 3600, 2) if now > booking.end_time else 0,
            }
            
            # Check if vehicle exceeds long-stay threshold
            if booking.checked_in_at <= cutoff_time:
                vehicle_info['alert_level'] = 'CRITICAL'
                vehicle_info['status'] = 'Long-Stay'
                long_stay_vehicles.append(vehicle_info)
                
                # Mark booking and send alerts
                self._handle_long_stay_vehicle(booking, vehicle_info)
            
            # Check if approaching long-stay threshold (early warning)
            elif hours_parked >= WARNING_THRESHOLD_HOURS:
                vehicle_info['alert_level'] = 'WARNING'
                vehicle_info['status'] = 'Approaching Long-Stay'
                warning_vehicles.append(vehicle_info)
                
                # Send early warning
                self._handle_warning_vehicle(booking, vehicle_info)
        
        # Log summary
        logger.info(f"Detection complete: {len(long_stay_vehicles)} long-stay, {len(warning_vehicles)} warnings")
        
        # Notify admins with summary
        if long_stay_vehicles or warning_vehicles:
            self._notify_admins_summary(long_stay_vehicles, warning_vehicles)
        
        return {
            'timestamp': now,
            'threshold_hours': self.threshold_hours,
            'long_stay_vehicles': long_stay_vehicles,
            'warning_vehicles': warning_vehicles,
            'total_parked': currently_parked.count(),
            'summary': {
                'critical_count': len(long_stay_vehicles),
                'warning_count': len(warning_vehicles),
                'normal_count': currently_parked.count() - len(long_stay_vehicles) - len(warning_vehicles),
            }
        }
    
    def _format_duration(self, duration):
        """Format timedelta into human-readable string"""
        total_seconds = int(duration.total_seconds())
        days = total_seconds // 86400
        hours = (total_seconds % 86400) // 3600
        minutes = (total_seconds % 3600) // 60
        
        parts = []
        if days > 0:
            parts.append(f"{days}d")
        if hours > 0:
            parts.append(f"{hours}h")
        if minutes > 0 or not parts:
            parts.append(f"{minutes}m")
        
        return " ".join(parts)
    
    def _handle_long_stay_vehicle(self, booking, vehicle_info):
        """Handle a vehicle that has exceeded the long-stay threshold"""
        # Check if already flagged to avoid duplicate notifications
        existing_flag = AuditLog.objects.filter(
            booking=booking,
            action='long_stay_detected',
            timestamp__gte=timezone.now() - timedelta(hours=12)  # Don't notify more than once per 12 hours
        ).exists()
        
        if existing_flag:
            logger.info(f"Booking {booking.id} already flagged as long-stay recently")
            return
        
        # Create audit log
        AuditLog.objects.create(
            booking=booking,
            user=booking.user,
            action='long_stay_detected',
            notes=f"Vehicle {vehicle_info['vehicle']['plate']} has been parked for {vehicle_info['timing']['current_duration_formatted']} (>24h)",
            ip_address=None,
            user_agent='system/long-stay-detection',
            success=True
        )
        
        # Notify the vehicle owner
        self._notify_user(booking, vehicle_info)
        
        # Notify all admins immediately about critical long-stay
        self._notify_admins_critical(booking, vehicle_info)
        
        logger.warning(f"LONG-STAY ALERT: Booking {booking.id}, Vehicle {vehicle_info['vehicle']['plate']}, Duration: {vehicle_info['timing']['current_duration_formatted']}")
    
    def _handle_warning_vehicle(self, booking, vehicle_info):
        """Handle a vehicle approaching long-stay threshold"""
        # Check if already warned
        existing_warning = AuditLog.objects.filter(
            booking=booking,
            action='long_stay_warning',
            timestamp__gte=timezone.now() - timedelta(hours=6)
        ).exists()
        
        if existing_warning:
            return
        
        # Create audit log
        AuditLog.objects.create(
            booking=booking,
            user=booking.user,
            action='long_stay_warning',
            notes=f"Vehicle {vehicle_info['vehicle']['plate']} approaching long-stay threshold: {vehicle_info['timing']['current_duration_formatted']}",
            ip_address=None,
            user_agent='system/long-stay-detection',
            success=True
        )
        
        # Notify the customer about approaching threshold
        self._notify_user_warning(booking, vehicle_info)
        
        # Notify admins about warning vehicles
        self._notify_admins_warning(booking, vehicle_info)
        
        logger.info(f"WARNING: Booking {booking.id} approaching long-stay threshold")
    
    def _notify_user(self, booking, vehicle_info):
        """Send critical notification to vehicle owner"""
        Notification.objects.create(
            user=booking.user,
            notification_type='system_alert',
            title='🚨 CRITICAL: Long-Stay Alert',
            message=f"Your vehicle ({vehicle_info['vehicle']['plate']}) has been parked for {vehicle_info['timing']['current_duration_formatted']} at {vehicle_info['slot']['parking_lot']}, Slot {vehicle_info['slot']['number']}. This exceeds the 24-hour limit. Please check out immediately to avoid additional charges and potential penalties.",
            related_object_id=str(booking.id),
            related_object_type='Booking',
            additional_data={
                'alert_type': 'long_stay_critical',
                'duration_hours': vehicle_info['timing']['current_duration_hours'],
                'slot_number': vehicle_info['slot']['number'],
                'priority': 'critical',
                'overtime_hours': vehicle_info['overtime_hours']
            }
        )
        logger.info(f"Sent critical long-stay notification to user {booking.user.username}")
    
    def _notify_user_warning(self, booking, vehicle_info):
        """Send warning notification to vehicle owner"""
        hours_remaining = 24 - vehicle_info['timing']['current_duration_hours']
        
        Notification.objects.create(
            user=booking.user,
            notification_type='reminder',
            title='⚡ Parking Duration Warning',
            message=f"Your vehicle ({vehicle_info['vehicle']['plate']}) has been parked for {vehicle_info['timing']['current_duration_formatted']} at {vehicle_info['slot']['parking_lot']}, Slot {vehicle_info['slot']['number']}. You have approximately {hours_remaining:.1f} hours remaining before the 24-hour limit. Please plan to check out soon.",
            related_object_id=str(booking.id),
            related_object_type='Booking',
            additional_data={
                'alert_type': 'long_stay_warning',
                'duration_hours': vehicle_info['timing']['current_duration_hours'],
                'slot_number': vehicle_info['slot']['number'],
                'priority': 'medium',
                'hours_remaining': round(hours_remaining, 1)
            }
        )
        logger.info(f"Sent warning notification to user {booking.user.username}")
    
    def _notify_admins_critical(self, booking, vehicle_info):
        """Send immediate critical alert to all admins for a single long-stay vehicle"""
        admins = User.objects.filter(role__in=['admin', 'security'], is_active=True)
        
        message = (
            f"🚨 CRITICAL ALERT\n\n"
            f"Vehicle: {vehicle_info['vehicle']['plate']} ({vehicle_info['vehicle']['type']})\n"
            f"Owner: {vehicle_info['user']['username']} ({vehicle_info['user']['email']})\n"
            f"Location: {vehicle_info['slot']['parking_lot']}\n"
            f"Slot: {vehicle_info['slot']['number']} (Floor {vehicle_info['slot']['floor']}, Section {vehicle_info['slot']['section']})\n"
            f"Duration: {vehicle_info['timing']['current_duration_formatted']}\n"
            f"Overtime: {vehicle_info['overtime_hours']:.1f} hours\n\n"
            f"⚠️ This vehicle has exceeded the 24-hour parking limit. Immediate action required."
        )
        
        for admin in admins:
            Notification.objects.create(
                user=admin,
                notification_type='system_alert',
                title=f'🚨 CRITICAL: Long-Stay Vehicle Detected',
                message=message,
                related_object_id=str(booking.id),
                related_object_type='Booking',
                additional_data={
                    'alert_type': 'long_stay_critical_admin',
                    'booking_id': booking.id,
                    'vehicle_plate': vehicle_info['vehicle']['plate'],
                    'duration_hours': vehicle_info['timing']['current_duration_hours'],
                    'slot_number': vehicle_info['slot']['number'],
                    'priority': 'critical'
                }
            )
        
        logger.info(f"Sent critical alert to {admins.count()} admin/security users for booking {booking.id}")
    
    def _notify_admins_warning(self, booking, vehicle_info):
        """Send warning alert to admins about vehicle approaching long-stay threshold"""
        admins = User.objects.filter(role__in=['admin', 'security'], is_active=True)
        
        hours_remaining = 24 - vehicle_info['timing']['current_duration_hours']
        
        message = (
            f"⚡ WARNING ALERT\n\n"
            f"Vehicle: {vehicle_info['vehicle']['plate']} ({vehicle_info['vehicle']['type']})\n"
            f"Owner: {vehicle_info['user']['username']}\n"
            f"Slot: {vehicle_info['slot']['number']} - {vehicle_info['slot']['parking_lot']}\n"
            f"Duration: {vehicle_info['timing']['current_duration_formatted']}\n"
            f"Est. Time to Limit: {hours_remaining:.1f} hours\n\n"
            f"This vehicle is approaching the 24-hour parking limit. Monitor for potential long-stay situation."
        )
        
        for admin in admins:
            Notification.objects.create(
                user=admin,
                notification_type='reminder',
                title=f'⚡ Vehicle Approaching Long-Stay Limit',
                message=message,
                related_object_id=str(booking.id),
                related_object_type='Booking',
                additional_data={
                    'alert_type': 'long_stay_warning_admin',
                    'booking_id': booking.id,
                    'vehicle_plate': vehicle_info['vehicle']['plate'],
                    'duration_hours': vehicle_info['timing']['current_duration_hours'],
                    'slot_number': vehicle_info['slot']['number'],
                    'priority': 'medium',
                    'hours_remaining': round(hours_remaining, 1)
                }
            )
        
        logger.info(f"Sent warning alert to {admins.count()} admin/security users for booking {booking.id}")
    
    def _notify_admins_summary(self, long_stay_vehicles, warning_vehicles):
        """Send comprehensive summary notification to all admins and security personnel"""
        admins = User.objects.filter(role__in=['admin', 'security'], is_active=True)
        
        # Build detailed summary message
        message_parts = []
        
        # Add header with counts
        message_parts.append("📊 LONG-STAY VEHICLE DETECTION SUMMARY")
        message_parts.append("=" * 50)
        
        if long_stay_vehicles:
            message_parts.append(f"\n🚨 CRITICAL: {len(long_stay_vehicles)} vehicle(s) exceed 24-hour limit:")
            message_parts.append("-" * 50)
            for idx, v in enumerate(long_stay_vehicles[:5], 1):  # Show first 5
                message_parts.append(
                    f"{idx}. {v['vehicle']['plate']} ({v['vehicle']['type']})\n"
                    f"   Location: Slot {v['slot']['number']} - {v['slot']['parking_lot']}\n"
                    f"   Duration: {v['timing']['current_duration_formatted']}\n"
                    f"   Overtime: {v['overtime_hours']:.1f}h\n"
                    f"   Owner: {v['user']['username']} ({v['user']['email']})"
                )
            if len(long_stay_vehicles) > 5:
                message_parts.append(f"\n   ... and {len(long_stay_vehicles) - 5} more critical vehicles")
        else:
            message_parts.append("\n✅ No critical long-stay vehicles detected")
        
        if warning_vehicles:
            message_parts.append(f"\n\n⚡ WARNING: {len(warning_vehicles)} vehicle(s) approaching 24-hour limit:")
            message_parts.append("-" * 50)
            for idx, v in enumerate(warning_vehicles[:3], 1):  # Show first 3
                hours_remaining = 24 - v['timing']['current_duration_hours']
                message_parts.append(
                    f"{idx}. {v['vehicle']['plate']} - Slot {v['slot']['number']}\n"
                    f"   Duration: {v['timing']['current_duration_formatted']} "
                    f"(~{hours_remaining:.1f}h remaining)"
                )
            if len(warning_vehicles) > 3:
                message_parts.append(f"\n   ... and {len(warning_vehicles) - 3} more warning vehicles")
        else:
            message_parts.append("\n\n✅ No vehicles approaching long-stay threshold")
        
        # Add footer with action items
        message_parts.append("\n" + "=" * 50)
        message_parts.append("⚠️ Action Required:")
        if long_stay_vehicles:
            message_parts.append("• Contact vehicle owners immediately")
            message_parts.append("• Verify vehicles are not abandoned")
            message_parts.append("• Consider additional charges or towing")
        if warning_vehicles:
            message_parts.append("• Monitor warning vehicles closely")
            message_parts.append("• Prepare for potential long-stay situations")
        
        message = "\n".join(message_parts)
        
        # Determine priority and title
        if long_stay_vehicles:
            priority = 'critical'
            title = f'🚨 CRITICAL: Long-Stay Summary ({len(long_stay_vehicles)} vehicles)'
        elif warning_vehicles:
            priority = 'medium'
            title = f'⚡ Long-Stay Warning Summary ({len(warning_vehicles)} vehicles)'
        else:
            priority = 'low'
            title = '✅ Long-Stay Detection - All Clear'
        
        # Create notifications for admins
        for admin in admins:
            Notification.objects.create(
                user=admin,
                notification_type='system_alert',
                title=title,
                message=message,
                additional_data={
                    'alert_type': 'long_stay_summary',
                    'critical_count': len(long_stay_vehicles),
                    'warning_count': len(warning_vehicles),
                    'priority': priority,
                    'timestamp': timezone.now().isoformat()
                }
            )
        
        logger.info(f"Sent long-stay summary ({priority} priority) to {admins.count()} admin/security users")


# Singleton instance
_service_instance = None

def get_long_stay_service():
    """Get or create singleton instance of LongStayDetectionService"""
    global _service_instance
    if _service_instance is None:
        _service_instance = LongStayDetectionService()
    return _service_instance


def detect_long_stay_vehicles():
    """Convenience function to run detection"""
    service = get_long_stay_service()
    return service.detect_long_stay_vehicles()
