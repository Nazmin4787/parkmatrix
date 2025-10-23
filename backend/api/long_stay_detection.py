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
            details=f"Vehicle {vehicle_info['vehicle']['plate']} has been parked for {vehicle_info['timing']['current_duration_formatted']} (>24h)",
            ip_address='system',
            success=True
        )
        
        # Notify the vehicle owner
        self._notify_user(booking, vehicle_info)
        
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
            details=f"Vehicle {vehicle_info['vehicle']['plate']} approaching long-stay threshold: {vehicle_info['timing']['current_duration_formatted']}",
            ip_address='system',
            success=True
        )
        
        logger.info(f"WARNING: Booking {booking.id} approaching long-stay threshold")
    
    def _notify_user(self, booking, vehicle_info):
        """Send notification to vehicle owner"""
        Notification.objects.create(
            user=booking.user,
            notification_type='system_alert',
            title='⚠️ Long-Stay Alert',
            message=f"Your vehicle ({vehicle_info['vehicle']['plate']}) has been parked for {vehicle_info['timing']['current_duration_formatted']} at {vehicle_info['slot']['parking_lot']}, Slot {vehicle_info['slot']['number']}. Please check out as soon as possible to avoid additional charges.",
            related_object_id=str(booking.id),
            related_object_type='Booking',
            additional_data={
                'alert_type': 'long_stay',
                'duration_hours': vehicle_info['timing']['current_duration_hours'],
                'slot_number': vehicle_info['slot']['number'],
                'priority': 'high'
            }
        )
    
    def _notify_admins_summary(self, long_stay_vehicles, warning_vehicles):
        """Send summary notification to all admins and security personnel"""
        admins = User.objects.filter(role__in=['admin', 'security'], is_active=True)
        
        # Build summary message
        message_parts = []
        
        if long_stay_vehicles:
            message_parts.append(f"🚨 {len(long_stay_vehicles)} vehicle(s) exceed 24-hour limit:")
            for v in long_stay_vehicles[:5]:  # Show first 5
                message_parts.append(
                    f"  • {v['vehicle']['plate']} - Slot {v['slot']['number']} - {v['timing']['current_duration_formatted']}"
                )
            if len(long_stay_vehicles) > 5:
                message_parts.append(f"  ... and {len(long_stay_vehicles) - 5} more")
        
        if warning_vehicles:
            message_parts.append(f"\n⚡ {len(warning_vehicles)} vehicle(s) approaching limit:")
            for v in warning_vehicles[:3]:  # Show first 3
                message_parts.append(
                    f"  • {v['vehicle']['plate']} - {v['timing']['current_duration_formatted']}"
                )
        
        message = "\n".join(message_parts)
        
        # Create notifications for admins
        for admin in admins:
            Notification.objects.create(
                user=admin,
                notification_type='system_alert',
                title=f'Long-Stay Vehicle Alert ({len(long_stay_vehicles)} critical)',
                message=message,
                additional_data={
                    'alert_type': 'long_stay_summary',
                    'critical_count': len(long_stay_vehicles),
                    'warning_count': len(warning_vehicles),
                    'priority': 'high'
                }
            )
        
        logger.info(f"Sent long-stay summary to {admins.count()} admin/security users")


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
