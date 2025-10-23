# Test Long-Stay Detection API
# Usage: .\test_long_stay_api.ps1

$baseUrl = "http://localhost:8000/api"

Write-Host "=== Long-Stay Vehicle Detection API Test ===" -ForegroundColor Cyan
Write-Host ""

# Prompt for admin token
$token = Read-Host "Enter your admin access token"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Error: Token is required" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 1: Check Scheduler Status
Write-Host "1. Checking scheduler status..." -ForegroundColor Yellow
try {
    $schedulerStatus = Invoke-RestMethod -Uri "$baseUrl/admin/scheduler/status/" -Headers $headers
    Write-Host "   ✓ Scheduler Running: $($schedulerStatus.running)" -ForegroundColor Green
    Write-Host "   ✓ Total Jobs: $($schedulerStatus.total_jobs)" -ForegroundColor Green
    
    if ($schedulerStatus.jobs) {
        Write-Host "   Scheduled Jobs:" -ForegroundColor Cyan
        foreach ($job in $schedulerStatus.jobs) {
            Write-Host "     - $($job.name) (Next run: $($job.next_run_time))" -ForegroundColor Gray
        }
    }
    Write-Host ""
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure you're using an admin token and the server is running" -ForegroundColor Yellow
    Write-Host ""
}

# Test 2: Get Current Long-Stay Vehicles
Write-Host "2. Fetching long-stay vehicles..." -ForegroundColor Yellow
try {
    $longStayData = Invoke-RestMethod -Uri "$baseUrl/admin/long-stay-vehicles/" -Headers $headers
    
    Write-Host "   ✓ Total Parked Vehicles: $($longStayData.total_parked)" -ForegroundColor Green
    Write-Host "   🚨 Critical (>24h): $($longStayData.summary.critical_count)" -ForegroundColor Red
    Write-Host "   ⚡ Warnings (>20h): $($longStayData.summary.warning_count)" -ForegroundColor Yellow
    Write-Host "   ✅ Normal: $($longStayData.summary.normal_count)" -ForegroundColor Green
    Write-Host ""
    
    if ($longStayData.long_stay_vehicles -and $longStayData.long_stay_vehicles.Count -gt 0) {
        Write-Host "   Critical Long-Stay Vehicles:" -ForegroundColor Red
        foreach ($vehicle in $longStayData.long_stay_vehicles) {
            Write-Host "     • Plate: $($vehicle.vehicle.plate)" -ForegroundColor White
            Write-Host "       User: $($vehicle.user.username) ($($vehicle.user.email))" -ForegroundColor Gray
            Write-Host "       Slot: $($vehicle.slot.number) at $($vehicle.slot.parking_lot)" -ForegroundColor Gray
            Write-Host "       Duration: $($vehicle.timing.current_duration_formatted) ($($vehicle.timing.current_duration_hours)h)" -ForegroundColor Gray
            if ($vehicle.is_overtime) {
                Write-Host "       ⏰ Overtime: $($vehicle.overtime_hours)h" -ForegroundColor Yellow
            }
            Write-Host ""
        }
    } else {
        Write-Host "   ✅ No critical long-stay vehicles found" -ForegroundColor Green
        Write-Host ""
    }
    
    if ($longStayData.warning_vehicles -and $longStayData.warning_vehicles.Count -gt 0) {
        Write-Host "   Warning Vehicles (Approaching Limit):" -ForegroundColor Yellow
        foreach ($vehicle in $longStayData.warning_vehicles) {
            Write-Host "     • Plate: $($vehicle.vehicle.plate) - $($vehicle.timing.current_duration_formatted)" -ForegroundColor White
        }
        Write-Host ""
    }
    
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Trigger Manual Detection
Write-Host "3. Trigger manual detection? (y/n): " -ForegroundColor Yellow -NoNewline
$triggerChoice = Read-Host

if ($triggerChoice -eq "y" -or $triggerChoice -eq "Y") {
    Write-Host "   Triggering detection..." -ForegroundColor Yellow
    try {
        $detectionResult = Invoke-RestMethod -Uri "$baseUrl/admin/long-stay-vehicles/detect/" -Method Post -Headers $headers
        Write-Host "   ✓ $($detectionResult.message)" -ForegroundColor Green
        Write-Host "   ✓ Found: $($detectionResult.results.summary.critical_count) critical, $($detectionResult.results.summary.warning_count) warnings" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "For more details, run: python manage.py detect_long_stay" -ForegroundColor Gray
