@echo off
echo =================================================
echo Parking System: Slot Management and Cleanup Script
echo =================================================
echo.

REM Check for Python and Django
python --version || goto :error

echo.
echo Step 1: Creating backup of the database
echo --------------------------------------
echo Creating a database backup before making changes...
python manage.py dumpdata > data_backup.json
IF %ERRORLEVEL% NEQ 0 goto :error
echo Database backup created successfully as data_backup.json

echo.
echo Step 2: Checking for active bookings
echo -----------------------------------
python manage.py shell -c "from api.models import Booking; print(f'Active bookings: {Booking.objects.filter(is_active=True).count()}')"

echo.
echo Step 3: Clearing slot data with active bookings preserved
echo ------------------------------------------------------
python manage.py clear_slot_data --preserve-active
IF %ERRORLEVEL% NEQ 0 goto :error

echo.
echo Step 4: Getting available parking lots
echo -----------------------------------
python manage.py shell -c "from api.models import ParkingLot; [print(f'ID: {lot.id}, Name: {lot.name}') for lot in ParkingLot.objects.all()]"

echo.
echo Step 5: Adding new slots with consistent naming
echo --------------------------------------------
set /p parking_lot_id="Enter parking lot ID to add slots to: "
python manage.py add_consistent_slots %parking_lot_id% --sections=A,B,C --slots-per-section=20 --floor=1 --vehicle-type=any
IF %ERRORLEVEL% NEQ 0 goto :error

echo.
echo Step 6: Verifying the new slot structure
echo -------------------------------------
python manage.py shell -c "from api.models import ParkingSlot; from collections import Counter; print(f'Total slots: {ParkingSlot.objects.count()}'); print(f'Slots by section: {Counter([slot.section for slot in ParkingSlot.objects.all()])}'); print(f'Slots by vehicle type: {Counter([slot.vehicle_type for slot in ParkingSlot.objects.all()])}')"
IF %ERRORLEVEL% NEQ 0 goto :error

echo.
echo Step 7: Checking for any remaining slot discrepancies
echo ------------------------------------------------
python manage.py fix_slot_discrepancies --check_all
IF %ERRORLEVEL% NEQ 0 goto :warning

echo.
echo =================================================
echo Slot management operations completed successfully!
echo =================================================
echo.
echo Please check the frontend to ensure slots are displaying correctly.
echo Navigate to the Admin Slot Management page to verify slot data.
goto :end

:warning
echo.
echo WARNING: The slot discrepancy check found issues. 
echo Review the output above and consider running:
echo python manage.py fix_slot_discrepancies --check_all --fix
goto :end

:error
echo.
echo ERROR: An error occurred during the slot management process.
echo Please check the output above for details.
exit /b %ERRORLEVEL%

:end
echo.
echo Script completed.