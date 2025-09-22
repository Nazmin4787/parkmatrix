from django.contrib import admin
from .models import User, ParkingSlot, Booking, PricingRate, Vehicle, ParkingLot

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')

@admin.register(ParkingLot)
class ParkingLotAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'hourly_rate')

@admin.register(ParkingSlot)
class ParkingSlotAdmin(admin.ModelAdmin):
    list_display = ('slot_number', 'parking_lot', 'floor', 'is_occupied')
    list_filter = ('parking_lot', 'is_occupied', 'floor')

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('number_plate', 'user', 'vehicle_type', 'is_default')
    list_filter = ('vehicle_type',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'slot', 'start_time', 'end_time', 'total_price', 'is_active')
    list_filter = ('is_active', 'start_time')

@admin.register(PricingRate)
class PricingRateAdmin(admin.ModelAdmin):
    list_display = ('rate_name', 'hourly_rate', 'daily_rate', 'vehicle_type', 'is_default')
    list_filter = ('vehicle_type', 'is_default')
