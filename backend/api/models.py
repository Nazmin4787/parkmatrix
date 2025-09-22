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
    parking_lot = models.ForeignKey(ParkingLot, on_delete=models.CASCADE, related_name='slots', null=True)
    slot_number = models.CharField(max_length=20)  # Remove unique=True if you have it
    floor = models.CharField(max_length=5)
    section = models.CharField(max_length=5, default='A')
    pos_x = models.IntegerField(default=0)
    pos_y = models.IntegerField(default=0)
    is_occupied = models.BooleanField(default=False)

    def __str__(self):
        return f"Slot {self.slot_number} (Floor {self.floor} , Section {self.section})"


class Vehicle(models.Model):
    VEHICLE_TYPE_CHOICES = [
        ('car', 'Car'),
        ('suv', 'SUV'),
        ('bike', 'Bike'),
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
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    slot = models.ForeignKey(ParkingSlot, on_delete=models.CASCADE)
    vehicle = models.ForeignKey('Vehicle', on_delete=models.SET_NULL, null=True, blank=True)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(default=timezone.now)
    total_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    vehicle_has_left = models.BooleanField(default=False)

    # Fields for handling extensions
    initial_end_time = models.DateTimeField(null=True, blank=True)
    extension_count = models.PositiveIntegerField(default=0)
    extension_history = models.JSONField(default=list, blank=True)

    def save(self, *args, **kwargs):
        if not self.initial_end_time:
            self.initial_end_time = self.end_time
        super().save(*args, **kwargs)

    def __str__(self):
        vehicle_info = f" with {self.vehicle.number_plate}" if self.vehicle else ""
        return f"Booking by {self.user.username} on slot {self.slot.slot_number}{vehicle_info}"

class PricingRate(models.Model):
    rate_name = models.CharField(max_length=100, unique=True)
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2)
    daily_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    extension_rate_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)
    is_default = models.BooleanField(default=False)
    
    VEHICLE_TYPE_CHOICES = [
        ('all', 'All'),
        ('car', 'Car'),
        ('suv', 'SUV'),
        ('bike', 'Bike'),
    ]
    vehicle_type = models.CharField(max_length=10, choices=VEHICLE_TYPE_CHOICES, default='all')
    
    effective_from = models.DateTimeField(null=True, blank=True)
    effective_to = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.rate_name} (${self.hourly_rate}/hr)"

    def save(self, *args, **kwargs):
        if self.is_default:
            # Ensure only one default rate exists
            PricingRate.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)
        
        
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