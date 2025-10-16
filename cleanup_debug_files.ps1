# Cleanup script for debug and test files
# This script removes all debug, test, and utility files that are not needed for running the website

Write-Host "Starting cleanup of debug and test files..." -ForegroundColor Green

# Define files to delete (excluding virtual environments and legitimate test folders)
$filesToDelete = @(
    # Root level test files
    "C:\Projects\parking-system\complete_booking_test.py",
    "C:\Projects\parking-system\create_test_user.py",
    "C:\Projects\parking-system\improved_notification_test.py",
    "C:\Projects\parking-system\manual_test_checkin_checkout.py",
    "C:\Projects\parking-system\phase9_1_frontend_test.py",
    "C:\Projects\parking-system\simple_test.py",
    "C:\Projects\parking-system\test_api_auth.py",
    "C:\Projects\parking-system\test_api_endpoints.py",
    "C:\Projects\parking-system\test_api_endpoints_simple.py",
    "C:\Projects\parking-system\test_api_root.py",
    "C:\Projects\parking-system\test_auth_notifications.py",
    "C:\Projects\parking-system\test_capacity_features.py",
    "C:\Projects\parking-system\test_checkin_api.py",
    "C:\Projects\parking-system\test_checkin_checkout_flow.py",
    "C:\Projects\parking-system\test_checkin_flow.py",
    "C:\Projects\parking-system\test_checkin_logic.py",
    "C:\Projects\parking-system\test_correct_booking.py",
    "C:\Projects\parking-system\test_correct_endpoint.py",
    "C:\Projects\parking-system\test_customer_booking.py",
    "C:\Projects\parking-system\test_final_api.py",
    "C:\Projects\parking-system\test_implementation.py",
    "C:\Projects\parking-system\test_login_api.py",
    "C:\Projects\parking-system\test_notification_api.py",
    "C:\Projects\parking-system\test_notification_fix.py",
    "C:\Projects\parking-system\test_system_setup.py",
    "C:\Projects\parking-system\test_with_slot_id.py",
    
    # Root level debug files
    "C:\Projects\parking-system\checkin_debug.py",
    "C:\Projects\parking-system\debug_booking_api.py",
    "C:\Projects\parking-system\debug_booking_id_35.py",
    "C:\Projects\parking-system\debug_checkin_api.py",
    "C:\Projects\parking-system\debug_checkin_booking35.py",
    "C:\Projects\parking-system\debug_complete_flow.py",
    "C:\Projects\parking-system\debug_headers_fix.py",
    "C:\Projects\parking-system\debug_login_issue.py",
    "C:\Projects\parking-system\debug_user_roles.py",
    
    # Root level utility files
    "C:\Projects\parking-system\check_bookings_simple.py",
    "C:\Projects\parking-system\check_users.py",
    "C:\Projects\parking-system\create_fresh_booking.py",
    "C:\Projects\parking-system\create_user_direct.py",
    "C:\Projects\parking-system\login_api_content_fix.py",
    "C:\Projects\parking-system\login_api_fix.py",
    "C:\Projects\parking-system\simple_notification_fix.py",
    
    # Backend test files
    "C:\Projects\parking-system\backend\direct_django_test.py",
    "C:\Projects\parking-system\backend\django_shell_test.py",
    "C:\Projects\parking-system\backend\focused_api_test.py",
    "C:\Projects\parking-system\backend\simple_notification_test.py",
    "C:\Projects\parking-system\backend\smtp_test.py",
    "C:\Projects\parking-system\backend\smtp_test_full.py",
    "C:\Projects\parking-system\backend\smtp_test_ssl.py",
    "C:\Projects\parking-system\backend\test_auth_admin.py",
    "C:\Projects\parking-system\backend\test_cancel_functionality.py",
    "C:\Projects\parking-system\backend\test_check_in_validation.py",
    "C:\Projects\parking-system\backend\test_complete_admin_flow.py",
    "C:\Projects\parking-system\backend\test_email_system.py",
    "C:\Projects\parking-system\backend\test_find_nearest_api.py",
    "C:\Projects\parking-system\backend\test_mailgun_api.py",
    "C:\Projects\parking-system\backend\test_notification_api.py",
    "C:\Projects\parking-system\backend\test_proper_auth.py",
    "C:\Projects\parking-system\backend\test_vehicle_types.py",
    
    # Backend debug files
    "C:\Projects\parking-system\backend\debug_admin_endpoints.py",
    "C:\Projects\parking-system\backend\debug_login.py",
    
    # Backend utility files
    "C:\Projects\parking-system\backend\check_bookings.py",
    "C:\Projects\parking-system\backend\check_db_schema.py",
    "C:\Projects\parking-system\backend\check_parking_data.py",
    "C:\Projects\parking-system\backend\create_sample_slots.py",
    "C:\Projects\parking-system\backend\diagnose_mailgun.py",
    
    # Backend API test files (not in proper tests folder)
    "C:\Projects\parking-system\backend\api\run_api_tests.py",
    "C:\Projects\parking-system\backend\api\tests.py",
    "C:\Projects\parking-system\backend\api\test_booking_features.py",
    
    # Temporary scripts
    "C:\Projects\parking-system\backend\temp_shell_commands.py",
    "C:\Projects\parking-system\backend\reset_parking_slots.py"
)

# Counter for deleted files
$deletedCount = 0
$notFoundCount = 0

# Delete each file
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -Force
            Write-Host "✓ Deleted: $file" -ForegroundColor Yellow
            $deletedCount++
        } catch {
            Write-Host "✗ Error deleting: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "- Not found: $file" -ForegroundColor Gray
        $notFoundCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "Files deleted: $deletedCount" -ForegroundColor Cyan
Write-Host "Files not found: $notFoundCount" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Green

# Also delete JavaScript test files
Write-Host "Checking for JavaScript test files..." -ForegroundColor Green

$jsTestFiles = @(
    "C:\Projects\parking-system\test_api_fix.js",
    "C:\Projects\parking-system\test_frontend_services.js",
    "C:\Projects\parking-system\frontend_api_test.js"
)

$jsDeletedCount = 0
foreach ($jsFile in $jsTestFiles) {
    if (Test-Path $jsFile) {
        try {
            Remove-Item $jsFile -Force
            Write-Host "✓ Deleted: $jsFile" -ForegroundColor Yellow
            $jsDeletedCount++
        } catch {
            Write-Host "✗ Error deleting: $jsFile - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

if ($jsDeletedCount -gt 0) {
    Write-Host "JavaScript test files deleted: $jsDeletedCount`n" -ForegroundColor Cyan
}

Write-Host "All cleanup operations completed!" -ForegroundColor Green
