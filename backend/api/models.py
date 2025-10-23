from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('admin', 'Admin'),
        ('security', 'Security'),
    )
    # Override username and email to remove unique constraints for MongoDB compatibility
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, null=True, blank=True)
    
    # Override USERNAME_FIELD to use email instead of username for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.username} ({self.role})"

class ParkingLot(models.Model):
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2, default=10.00)
    daily_rate = models.DecimalField(max_digits=6, decimal_places=2, default=50.00)
    monthly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=300.00)

    def __str__(self):
        return self.name

class ParkingSlot(models.Model):
    VEHICLE_TYPE_CHOICES = [
        ('car', 'Car'),
        ('suv', 'SUV'), 
        ('bike', 'Bike'),
        ('truck', 'Truck'),
        ('any', 'Any Vehicle'),  # For flexible slots
    ]
    
    PARKING_ZONE_CHOICES = [
        ('COLLEGE_PARKING_CENTER', 'College Parking'),
        ('HOME_PARKING_CENTER', 'Home Parking'),
        ('METRO_PARKING_CENTER', 'Metro Parking'),
        ('VIVIVANA_PARKING_CENTER', 'Vivivana Parking'),
    ]
    
    parking_lot = models.ForeignKey(ParkingLot, on_delete=models.CASCADE, related_name='slots', null=True)
    slot_number = models.CharField(max_length=20)
    floor = models.CharField(max_length=5)
    section = models.CharField(max_length=5, default='A')
    pos_x = models.IntegerField(default=0)
    pos_y = models.IntegerField(default=0)
    is_occupied = models.BooleanField(default=False)
    
    # Dimension fields (required by database schema)
    height_cm = models.IntegerField(default=200, help_text="Height of parking slot in centimeters")
    width_cm = models.IntegerField(default=300, help_text="Width of parking slot in centimeters") 
    length_cm = models.IntegerField(default=500, help_text="Length of parking slot in centimeters")
    
    # New field for vehicle type
    vehicle_type = models.CharField(
        max_length=10, 
        choices=VEHICLE_TYPE_CHOICES, 
        default='any',
        help_text="Type of vehicle this slot is designated for"
    )
    
    # New field for parking zone
    parking_zone = models.CharField(
        max_length=30,
        choices=PARKING_ZONE_CHOICES,
        default='COLLEGE_PARKING_CENTER',
        help_text="Parking zone/location this slot belongs to"
    )

    def __str__(self):
        zone_display = dict(self.PARKING_ZONE_CHOICES).get(self.parking_zone, self.parking_zone)
        return f"Slot {self.slot_number} ({self.vehicle_type}) - {zone_display} - Floor {self.floor}, Section {self.section}"
    
    def is_compatible_with_vehicle(self, vehicle_type):
        """Check if this slot can accommodate the given vehicle type"""
        return self.vehicle_type == 'any' or self.vehicle_type == vehicle_type

class Vehicle(models.Model):
    VEHICLE_TYPE_CHOICES = [
        ('car', 'Car'),
        ('suv', 'SUV'),
        ('bike', 'Bike'),
        ('truck', 'Truck'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vehicle_type = models.CharField(max_length=10, choices=VEHICLE_TYPE_CHOICES)
    number_plate = models.CharField(max_length=20)
    model = models.CharField(max_length=50)
    color = models.CharField(max_length=20, blank=True)

    # New field: mark as favorite or default vehicle
    is_default = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.is_default:
            # Reset other vehicles' is_default for this user to False
            Vehicle.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.vehicle_type} - {self.number_plate}"

# Booking model unchanged (links vehicle FK)



















# Booking model
class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    slot = models.ForeignKey(ParkingSlot, on_delete=models.CASCADE)
    vehicle = models.ForeignKey('Vehicle', on_delete=models.SET_NULL, null=True, blank=True)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(default=timezone.now)
    total_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    vehicle_has_left = models.BooleanField(default=False)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')

    # Fields for handling extensions
    initial_end_time = models.DateTimeField(null=True, blank=True)
    extension_count = models.PositiveIntegerField(default=0)
    extension_history = models.JSONField(default=list, blank=True)
    
    # Check-in fields
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='checked_in_bookings')
    checked_in_ip = models.GenericIPAddressField(null=True, blank=True)
    check_in_notes = models.TextField(blank=True, null=True)
    
    # Check-out fields
    checked_out_at = models.DateTimeField(null=True, blank=True)
    checked_out_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='checked_out_bookings')
    checked_out_ip = models.GenericIPAddressField(null=True, blank=True)
    check_out_notes = models.TextField(blank=True, null=True)
    
    # Overtime calculation
    actual_duration_minutes = models.IntegerField(null=True, blank=True)
    overtime_minutes = models.IntegerField(default=0)
    overtime_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        if not self.initial_end_time:
            self.initial_end_time = self.end_time
        super().save(*args, **kwargs)
    
    def can_check_in(self, user):
        """
        Validate if booking can be checked in.
        Returns: (bool, str) - (can_check_in, error_message)
        """
        # Check if already checked in
        if self.status == 'checked_in':
            return False, "Booking is already checked in"
        
        # Check if already checked out
        if self.status == 'checked_out':
            return False, "Booking has already been checked out"
        
        # Check if cancelled or expired
        if self.status in ['cancelled', 'expired']:
            return False, f"Cannot check in a {self.status} booking"
        
        # Check user role permissions
        if user.role not in ['security', 'admin']:
            # Customers can only check in their own bookings
            if user != self.user:
                return False, "You can only check in your own bookings"
        
        # Check time window (30 minutes before start to 2 hours after end time)
        now = timezone.now()
        check_in_window_start = self.start_time - timezone.timedelta(minutes=30)
        grace_period = timezone.timedelta(hours=2)
        check_in_window_end = self.end_time + grace_period
        
        if now < check_in_window_start:
            minutes_early = int((check_in_window_start - now).total_seconds() / 60)
            return False, f"Check-in opens {minutes_early} minutes before booking start time"
        
        if now > check_in_window_end:
            return False, "Booking expired beyond grace period. Check-in window has closed"
        
        return True, ""
    
    def can_check_out(self, user):
        """
        Validate if booking can be checked out.
        Returns: (bool, str) - (can_check_out, error_message)
        """
        # Must be checked in first
        if self.status != 'checked_in':
            return False, "Booking must be checked in before checking out"
        
        # Check if already checked out
        if self.status == 'checked_out':
            return False, "Booking has already been checked out"
        
        # Check user role permissions
        if user.role not in ['security', 'admin']:
            # Customers can only check out their own bookings
            if user != self.user:
                return False, "You can only check out your own bookings"
        
        return True, ""
    
    def calculate_overtime(self):
        """
        Calculate overtime charges if check-out is after end_time.
        Updates overtime_minutes and overtime_amount fields.
        """
        if not self.checked_out_at:
            return
        
        # Calculate actual duration
        if self.checked_in_at:
            actual_duration = self.checked_out_at - self.checked_in_at
            self.actual_duration_minutes = int(actual_duration.total_seconds() / 60)
        
        # Calculate overtime
        if self.checked_out_at > self.end_time:
            overtime = self.checked_out_at - self.end_time
            self.overtime_minutes = int(overtime.total_seconds() / 60)
            
            # Calculate overtime charge (hourly rate from parking lot)
            if self.overtime_minutes > 0 and self.slot.parking_lot:
                overtime_hours = self.overtime_minutes / 60
                hourly_rate = self.slot.parking_lot.hourly_rate or 0
                self.overtime_amount = round(overtime_hours * float(hourly_rate), 2)
        else:
            self.overtime_minutes = 0
            self.overtime_amount = 0.00

    def __str__(self):
        vehicle_info = f" with {self.vehicle.number_plate}" if self.vehicle else ""
        return f"Booking by {self.user.username} on slot {self.slot.slot_number}{vehicle_info}"


class AuditLog(models.Model):
    """
    Tracks all check-in and check-out attempts for security and audit purposes.
    """
    ACTION_CHOICES = [
        ('check_in_attempt', 'Check-in Attempt'),
        ('check_in_success', 'Check-in Success'),
        ('check_in_failed', 'Check-in Failed'),
        ('check_out_attempt', 'Check-out Attempt'),
        ('check_out_success', 'Check-out Success'),
        ('check_out_failed', 'Check-out Failed'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    # Additional metadata
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    additional_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['booking', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
        ]
    
    def __str__(self):
        status = "Success" if self.success else "Failed"
        return f"{self.action} - {status} by {self.user.username if self.user else 'Unknown'} at {self.timestamp}"


class PricingRate(models.Model):
    """
    Model to define parking rates based on vehicle type and time periods.
    Supports hourly, daily, weekend, holiday, and special time slot rates.
    """
    rate_name = models.CharField(max_length=100, unique=True, help_text="Name of the rate plan")
    description = models.TextField(blank=True, help_text="Description of the rate plan")
    
    # Vehicle type choices - updated to match requirements
    VEHICLE_TYPE_CHOICES = [
        ('all', 'All Vehicles'),
        ('2-wheeler', '2-Wheeler (Bike/Scooter)'),
        ('4-wheeler', '4-Wheeler (Car/Sedan)'),
        ('suv', 'SUV'),
        ('electric', 'Electric Vehicle'),
        ('heavy', 'Heavy Vehicle (Truck/Bus)'),
        # Keep legacy options for backward compatibility
        ('car', 'Car'),
        ('bike', 'Bike'),
    ]
    vehicle_type = models.CharField(
        max_length=15, 
        choices=VEHICLE_TYPE_CHOICES, 
        default='all',
        help_text="Type of vehicle this rate applies to"
    )
    
    # Base rates
    hourly_rate = models.DecimalField(
        max_digits=6, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Rate per hour in ₹"
    )
    daily_rate = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Flat rate for full day (24 hours) in ₹"
    )
    
    # Special rates
    weekend_rate = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Special hourly rate for weekends (Sat/Sun) in ₹"
    )
    holiday_rate = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Special hourly rate for public holidays in ₹"
    )
    
    # Time slot based rates
    time_slot_start = models.TimeField(
        null=True, 
        blank=True,
        help_text="Start time for special rate (e.g., 18:00 for evening)"
    )
    time_slot_end = models.TimeField(
        null=True, 
        blank=True,
        help_text="End time for special rate (e.g., 06:00 for morning)"
    )
    special_rate = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Special hourly rate for specific time slot in ₹"
    )
    
    # Extension and multipliers
    extension_rate_multiplier = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        default=1.0,
        help_text="Multiplier for overtime/extension charges"
    )
    
    # Status and control
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this rate is currently active"
    )
    is_default = models.BooleanField(
        default=False,
        help_text="Whether this is the default rate for the vehicle type"
    )
    
    # Validity period
    effective_from = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Date/time when this rate becomes effective"
    )
    effective_to = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Date/time when this rate expires"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'vehicle_type', 'rate_name']
        verbose_name = "Pricing Rate"
        verbose_name_plural = "Pricing Rates"

    def __str__(self):
        vehicle_display = self.get_vehicle_type_display()
        return f"{self.rate_name} - {vehicle_display} (₹{self.hourly_rate}/hr)"

    def save(self, *args, **kwargs):
        # Ensure only one default rate exists per vehicle type
        if self.is_default:
            PricingRate.objects.filter(
                is_default=True, 
                vehicle_type=self.vehicle_type
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)
    
    def get_applicable_rate(self, booking_datetime=None):
        """
        Get the applicable hourly rate based on date/time.
        Returns the appropriate rate (regular, weekend, holiday, or time slot).
        """
        from django.utils import timezone
        
        if booking_datetime is None:
            booking_datetime = timezone.now()
        
        # Check if it's a weekend (Saturday=5, Sunday=6)
        if booking_datetime.weekday() in [5, 6] and self.weekend_rate:
            return self.weekend_rate
        
        # Check if it's within special time slot
        if self.time_slot_start and self.time_slot_end and self.special_rate:
            booking_time = booking_datetime.time()
            # Handle time slots that cross midnight
            if self.time_slot_start <= self.time_slot_end:
                if self.time_slot_start <= booking_time <= self.time_slot_end:
                    return self.special_rate
            else:
                if booking_time >= self.time_slot_start or booking_time <= self.time_slot_end:
                    return self.special_rate
        
        # Default to regular hourly rate
        return self.hourly_rate
    
    def calculate_fee(self, hours=0, days=0, booking_datetime=None):
        """
        Calculate parking fee based on duration.
        Args:
            hours: Number of hours
            days: Number of days
            booking_datetime: DateTime for rate calculation (weekends, holidays, etc.)
        Returns:
            Decimal: Total fee in ₹
        """
        from decimal import Decimal
        from django.utils import timezone
        
        if booking_datetime is None:
            booking_datetime = timezone.now()
        
        total_fee = Decimal('0.00')
        
        # Calculate daily rate if applicable
        if days > 0 and self.daily_rate:
            total_fee += self.daily_rate * Decimal(str(days))
        
        # Calculate hourly rate
        if hours > 0:
            applicable_rate = self.get_applicable_rate(booking_datetime)
            total_fee += applicable_rate * Decimal(str(hours))
        
        return total_fee
    
    def is_valid_now(self):
        """Check if this rate is currently valid based on effective dates."""
        from django.utils import timezone
        now = timezone.now()
        
        if not self.is_active:
            return False
        
        if self.effective_from and now < self.effective_from:
            return False
        
        if self.effective_to and now > self.effective_to:
            return False
        
        return True
        
        
class DynamicPricingRule(models.Model):
    """
    Defines rules for adjusting pricing based on parking lot occupancy levels.
    """
    name = models.CharField(max_length=100)
    parking_lot = models.ForeignKey(ParkingLot, on_delete=models.CASCADE, related_name='pricing_rules')
    
    # Occupancy thresholds (in percentage)
    min_occupancy = models.IntegerField(default=0, help_text="Minimum occupancy percentage for this rule to apply")
    max_occupancy = models.IntegerField(default=100, help_text="Maximum occupancy percentage for this rule to apply")
    
    # Price adjustment factors
    price_multiplier = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        default=1.0,
        help_text="Multiplier to apply to the base price"
    )
    
    # Rule priority (higher number = higher priority)
    priority = models.IntegerField(default=0, help_text="Priority when multiple rules match")
    
    # Time-based restrictions
    applies_weekdays = models.BooleanField(default=True)
    applies_weekends = models.BooleanField(default=True)
    start_hour = models.IntegerField(default=0, help_text="Hour of day when rule starts (0-23)")
    end_hour = models.IntegerField(default=23, help_text="Hour of day when rule ends (0-23)")
    
    # Rule status
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"{self.name} ({status}) - {self.min_occupancy}% to {self.max_occupancy}% occupancy: {self.price_multiplier}x"
        
    class Meta:
        ordering = ['-priority', 'min_occupancy']

# Notification model for in-app notifications
class Notification(models.Model):
    NOTIFICATION_TYPES = (
        # Booking related notifications
        ('booking_confirmation', 'Booking Confirmation'),
        ('booking_reminder', 'Booking Reminder'),
        ('booking_cancelled', 'Booking Cancelled'),
        ('booking_expiry', 'Booking Expiry'),
        ('booking_update', 'Booking Update'),
        ('booking_error', 'Booking Error'),
        
        # Parking lot status notifications
        ('lot_full', 'Parking Lot Full'),
        ('lot_available', 'Parking Available'),
        ('slot_reserved', 'Slot Reserved'),
        
        # Account and payment notifications
        ('account_update', 'Account Update'),
        ('payment_confirmation', 'Payment Confirmation'),
        ('payment_failed', 'Payment Failed'),
        ('payment_receipt', 'Payment Receipt'),
        
        # System notifications
        ('system_alert', 'System Alert'),
        ('maintenance', 'Maintenance Alert'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    related_object_id = models.CharField(max_length=50, blank=True, null=True)
    related_object_type = models.CharField(max_length=50, blank=True, null=True)
    additional_data = models.JSONField(default=dict, blank=True)  # Store additional structured data for rich display
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification_type}: {self.title}"


# Access Log model for tracking user login/logout activity
class AccessLog(models.Model):
    STATUS_CHOICES = (
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('locked', 'Account Locked'),
    )
    
    DEVICE_TYPE_CHOICES = (
        ('desktop', 'Desktop'),
        ('mobile', 'Mobile'),
        ('tablet', 'Tablet'),
        ('unknown', 'Unknown'),
    )
    
    # User information
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='access_logs', null=True, blank=True)
    username = models.CharField(max_length=150, blank=True, help_text="Username at time of login attempt")
    email = models.EmailField(blank=True, help_text="Email used for login attempt")
    role = models.CharField(max_length=10, blank=True, help_text="User role (customer/admin/security)")
    
    # Timestamps
    login_timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    logout_timestamp = models.DateTimeField(null=True, blank=True)
    
    # Network information
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text="IP address of login attempt")
    location_city = models.CharField(max_length=100, blank=True, help_text="City from IP geolocation")
    location_country = models.CharField(max_length=100, blank=True, help_text="Country from IP geolocation")
    latitude = models.FloatField(null=True, blank=True, help_text="GPS latitude (if available)")
    longitude = models.FloatField(null=True, blank=True, help_text="GPS longitude (if available)")
    
    # Login status
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='success', db_index=True)
    failure_reason = models.TextField(blank=True, help_text="Reason for failed login")
    
    # Device information
    user_agent = models.TextField(blank=True, help_text="Browser/device user agent string")
    device_type = models.CharField(max_length=10, choices=DEVICE_TYPE_CHOICES, default='unknown')
    browser = models.CharField(max_length=50, blank=True)
    operating_system = models.CharField(max_length=50, blank=True)
    
    # Session tracking
    session_id = models.CharField(max_length=255, blank=True, help_text="Session ID for logout tracking")
    
    class Meta:
        ordering = ['-login_timestamp']
        indexes = [
            models.Index(fields=['user', 'login_timestamp']),
            models.Index(fields=['status', 'login_timestamp']),
            models.Index(fields=['ip_address']),
        ]
        verbose_name = 'Access Log'
        verbose_name_plural = 'Access Logs'
    
    def __str__(self):
        status_icon = "✓" if self.status == 'success' else "✗"
        return f"{status_icon} {self.username} ({self.role}) - {self.login_timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
    
    @property
    def session_duration(self):
        """Calculate session duration in minutes"""
        if self.logout_timestamp and self.login_timestamp:
            delta = self.logout_timestamp - self.login_timestamp
            return int(delta.total_seconds() / 60)
        return None
    
    @property
    def is_active_session(self):
        """Check if session is still active (no logout timestamp)"""
        return self.logout_timestamp is None and self.status == 'success'


class ZonePricingRate(models.Model):
    """Pricing rates specific to parking zones"""
    PARKING_ZONE_CHOICES = [
        ('COLLEGE_PARKING_CENTER', 'College Parking Center'),
        ('HOME_PARKING_CENTER', 'Home Parking Center'),
        ('METRO_PARKING_CENTER', 'Metro Parking Center'),
        ('VIVIVANA_PARKING_CENTER', 'Vivivana Parking Center'),
    ]
    
    VEHICLE_TYPE_CHOICES = [
        ('car', 'Car'),
        ('bike', 'Bike'),
        ('suv', 'SUV'),
        ('truck', 'Truck'),
        ('any', 'Any Vehicle'),
    ]
    
    parking_zone = models.CharField(
        max_length=50,
        choices=PARKING_ZONE_CHOICES,
        help_text="Parking zone for this rate"
    )
    vehicle_type = models.CharField(
        max_length=20,
        choices=VEHICLE_TYPE_CHOICES,
        help_text="Vehicle type for this rate"
    )
    rate_name = models.CharField(
        max_length=100,
        help_text="Display name for this rate"
    )
    description = models.TextField(blank=True, null=True)
    
    # Pricing
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Hourly parking rate"
    )
    daily_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Daily parking rate (24 hours)"
    )
    weekend_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Weekend hourly rate (optional, defaults to hourly_rate)"
    )
    
    # Status and validity
    is_active = models.BooleanField(default=True)
    effective_from = models.DateTimeField(
        default=timezone.now,
        help_text="When this rate becomes effective"
    )
    effective_to = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this rate expires (optional)"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_zone_rates'
    )
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [['parking_zone', 'vehicle_type', 'is_active']]
        indexes = [
            models.Index(fields=['parking_zone', 'vehicle_type']),
            models.Index(fields=['is_active', 'effective_from']),
        ]
    
    def __str__(self):
        return f"{self.get_parking_zone_display()} - {self.get_vehicle_type_display()}: ₹{self.hourly_rate}/hr"
    
    def get_effective_rate(self, is_weekend=False):
        """Get the effective rate based on day type"""
        if is_weekend and self.weekend_rate:
            return self.weekend_rate
        return self.hourly_rate
    
    def is_valid_now(self):
        """Check if rate is currently valid"""
        now = timezone.now()
        if not self.is_active:
            return False
        if self.effective_from > now:
            return False
        if self.effective_to and self.effective_to < now:
            return False
        return True