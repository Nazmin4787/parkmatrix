# Parking System: Slot Management and Cleanup Script

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Parking System: Slot Management and Cleanup Script" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check for Python and Django
try {
    python --version
} catch {
    Write-Host "ERROR: Python not found or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 1: Creating backup of the database" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Yellow
Write-Host "Creating a database backup before making changes..."
python manage.py dumpdata > data_backup.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create database backup" -ForegroundColor Red
    exit 1
}
Write-Host "Database backup created successfully as data_backup.json" -ForegroundColor Green

Write-Host "`nStep 2: Checking for active bookings" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow
python manage.py shell -c "from api.models import Booking; print(f'Active bookings: {Booking.objects.filter(is_active=True).count()}')"

Write-Host "`nStep 3: Clearing slot data with active bookings preserved" -ForegroundColor Yellow
Write-Host "------------------------------------------------------" -ForegroundColor Yellow
python manage.py clear_slot_data --preserve-active
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to clear slot data" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 4: Getting available parking lots" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow
python manage.py shell -c "from api.models import ParkingLot; [print(f'ID: {lot.id}, Name: {lot.name}') for lot in ParkingLot.objects.all()]"

Write-Host "`nStep 5: Adding new slots with consistent naming" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Yellow
$parking_lot_id = Read-Host "Enter parking lot ID to add slots to"
python manage.py add_consistent_slots $parking_lot_id --sections=A,B,C --slots-per-section=20 --floor=1 --vehicle-type=any
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to add new slots" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 6: Verifying the new slot structure" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Yellow
python manage.py shell -c "from api.models import ParkingSlot; from collections import Counter; print(f'Total slots: {ParkingSlot.objects.count()}'); print(f'Slots by section: {Counter([slot.section for slot in ParkingSlot.objects.all()])}'); print(f'Slots by vehicle type: {Counter([slot.vehicle_type for slot in ParkingSlot.objects.all()])}')"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to verify slot structure" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 7: Checking for any remaining slot discrepancies" -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Yellow
python manage.py fix_slot_discrepancies --check_all
$discrepancy_check_result = $LASTEXITCODE

if ($discrepancy_check_result -eq 0) {
    Write-Host "`n=================================================" -ForegroundColor Green
    Write-Host "Slot management operations completed successfully!" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
    Write-Host "`nPlease check the frontend to ensure slots are displaying correctly."
    Write-Host "Navigate to the Admin Slot Management page to verify slot data."
} else {
    Write-Host "`nWARNING: The slot discrepancy check found issues." -ForegroundColor Yellow
    Write-Host "Review the output above and consider running:" -ForegroundColor Yellow
    Write-Host "python manage.py fix_slot_discrepancies --check_all --fix" -ForegroundColor Yellow
}

Write-Host "`nScript completed."