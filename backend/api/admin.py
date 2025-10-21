from django.contrib import admin
from .models import User, ParkingSlot, Booking, PricingRate, Vehicle, ParkingLot, AccessLog

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')

@admin.register(ParkingLot)
class ParkingLotAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'hourly_rate')

@admin.register(ParkingSlot)
class ParkingSlotAdmin(admin.ModelAdmin):
    list_display = ['slot_number', 'floor', 'section', 'vehicle_type', 'is_occupied', 'parking_lot']
    list_filter = ['vehicle_type', 'is_occupied', 'floor', 'parking_lot']
    search_fields = ['slot_number', 'section']
    list_editable = ['vehicle_type', 'is_occupied']
    
    actions = ['set_car_type', 'set_bike_type', 'set_truck_type', 'set_any_type']
    
    def set_car_type(self, request, queryset):
        queryset.update(vehicle_type='car')
        self.message_user(request, f'{queryset.count()} slots updated to Car type')
    set_car_type.short_description = "Set selected slots to Car type"
    
    def set_bike_type(self, request, queryset):
        queryset.update(vehicle_type='bike')
        self.message_user(request, f'{queryset.count()} slots updated to Bike type')
    set_bike_type.short_description = "Set selected slots to Bike type"
    
    def set_truck_type(self, request, queryset):
        queryset.update(vehicle_type='truck')
        self.message_user(request, f'{queryset.count()} slots updated to Truck type')
    set_truck_type.short_description = "Set selected slots to Truck type"
    
    def set_any_type(self, request, queryset):
        queryset.update(vehicle_type='any')
        self.message_user(request, f'{queryset.count()} slots updated to Any Vehicle type')
    set_any_type.short_description = "Set selected slots to Any Vehicle type"

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['number_plate', 'vehicle_type', 'model', 'user', 'is_default']
    list_filter = ['vehicle_type', 'is_default']
    search_fields = ['number_plate', 'model', 'user__username']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'slot', 'start_time', 'end_time', 'total_price', 'is_active')
    list_filter = ('is_active', 'start_time')

@admin.register(PricingRate)
class PricingRateAdmin(admin.ModelAdmin):
    list_display = ('rate_name', 'hourly_rate', 'daily_rate', 'vehicle_type', 'is_default')
    list_filter = ('vehicle_type', 'is_default')


@admin.register(AccessLog)
class AccessLogAdmin(admin.ModelAdmin):
    list_display = ('username', 'role', 'login_timestamp', 'logout_timestamp', 'ip_address', 'location_city', 'status', 'device_type')
    list_filter = ('status', 'role', 'device_type', 'login_timestamp')
    search_fields = ('username', 'email', 'ip_address', 'location_city', 'location_country')
    readonly_fields = (
        'user', 'username', 'email', 'role', 'login_timestamp', 'logout_timestamp',
        'ip_address', 'location_city', 'location_country', 'latitude', 'longitude',
        'status', 'failure_reason', 'user_agent', 'device_type', 'browser',
        'operating_system', 'session_id'
    )
    date_hierarchy = 'login_timestamp'
    ordering = ('-login_timestamp',)
    
    def has_add_permission(self, request):
        # Prevent manual addition of access logs
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Only superusers can delete access logs
        return request.user.is_superuser
