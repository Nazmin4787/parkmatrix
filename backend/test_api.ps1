# PowerShell Script to Test Check-In/Check-Out Logs API
# Run this in PowerShell

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  CHECK-IN/CHECK-OUT LOGS API TEST SUITE" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Configuration
$baseUrl = "http://127.0.0.1:8000/api"
$email = "admin1@example.com"  # Change if needed
$password = "admin123"          # Change if needed

# Test results tracking
$passed = 0
$failed = 0

function Print-Success {
    param($message)
    Write-Host "✓ $message" -ForegroundColor Green
}

function Print-Error {
    param($message)
    Write-Host "✗ $message" -ForegroundColor Red
}

function Print-Info {
    param($message)
    Write-Host "ℹ $message" -ForegroundColor Yellow
}

function Print-Header {
    param($message)
    Write-Host "`n============================================================" -ForegroundColor Blue
    Write-Host $message -ForegroundColor Blue
    Write-Host "============================================================`n" -ForegroundColor Blue
}

# Test 1: Login
Print-Header "TEST 1: Authentication"

try {
    $body = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login/" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"

    $token = $loginResponse.access
    $username = $loginResponse.user.username
    $role = $loginResponse.user.role

    Print-Success "Login successful!"
    Print-Info "User: $username"
    Print-Info "Role: $role"
    Print-Info "Token received: $($token.Substring(0, 20))..."
    
    $passed++
} catch {
    Print-Error "Login failed: $_"
    $failed++
    Write-Host "`nCannot proceed without authentication. Exiting." -ForegroundColor Red
    exit
}

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 2: List All Logs
Print-Header "TEST 2: List All Check-In/Check-Out Logs"

try {
    $logs = Invoke-RestMethod -Uri "$baseUrl/admin/checkin-checkout-logs/" `
        -Headers $headers
    
    Print-Success "Retrieved $($logs.Count) log entries"
    
    if ($logs.Count -gt 0) {
        Print-Info "Sample log entry:"
        $logs[0] | ConvertTo-Json -Depth 2 | Write-Host
    } else {
        Print-Info "No log entries found"
    }
    
    $passed++
} catch {
    Print-Error "Failed: $($_.Exception.Message)"
    $failed++
}

# Test 3: Filter by Check-In Success
Print-Header "TEST 3: Filter by Check-In Success"

try {
    $filtered = Invoke-RestMethod -Uri "$baseUrl/admin/checkin-checkout-logs/?action=check_in&status=success" `
        -Headers $headers
    
    Print-Success "Filter works! Found $($filtered.Count) successful check-ins"
    $passed++
} catch {
    Print-Error "Failed: $($_.Exception.Message)"
    $failed++
}

# Test 4: Filter by Date
Print-Header "TEST 4: Filter by Date Range"

try {
    $dateFrom = "2025-10-01"
    $filtered = Invoke-RestMethod -Uri "$baseUrl/admin/checkin-checkout-logs/?date_from=$dateFrom" `
        -Headers $headers
    
    Print-Success "Date filter works! Found $($filtered.Count) entries since $dateFrom"
    $passed++
} catch {
    Print-Error "Failed: $($_.Exception.Message)"
    $failed++
}

# Test 5: Statistics
Print-Header "TEST 5: Check-In/Check-Out Statistics"

try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/admin/checkin-checkout-logs/stats/" `
        -Headers $headers
    
    Print-Success "Statistics retrieved successfully!"
    Write-Host "`n📊 Statistics Summary:" -ForegroundColor Cyan
    Write-Host "  • Total Check-Ins: $($stats.total_check_ins)"
    Write-Host "  • Failed Check-Ins: $($stats.failed_check_ins)"
    Write-Host "  • Total Check-Outs: $($stats.total_check_outs)"
    Write-Host "  • Failed Check-Outs: $($stats.failed_check_outs)"
    Write-Host "  • Currently Parked: $($stats.currently_parked)"
    Write-Host "  • Average Duration: $($stats.average_parking_duration_hours) hours"
    Write-Host "  • Completed Sessions: $($stats.total_completed_sessions)"
    
    if ($stats.check_ins_by_vehicle_type) {
        Write-Host "`n🚗 Check-Ins by Vehicle Type:" -ForegroundColor Cyan
        $stats.check_ins_by_vehicle_type.PSObject.Properties | ForEach-Object {
            Write-Host "  • $($_.Name): $($_.Value)"
        }
    }
    
    $passed++
} catch {
    Print-Error "Failed: $($_.Exception.Message)"
    $failed++
}

# Test 6: Currently Parked Vehicles
Print-Header "TEST 6: Currently Parked Vehicles"

try {
    $parked = Invoke-RestMethod -Uri "$baseUrl/admin/currently-parked/" `
        -Headers $headers
    
    Print-Success "Found $($parked.Count) currently parked vehicles"
    
    if ($parked.Count -gt 0) {
        Write-Host "`n🅿️ Currently Parked:" -ForegroundColor Cyan
        $parked | Select-Object -First 3 | ForEach-Object {
            Write-Host "`n  Vehicle: $($_.vehicle_info.number_plate)"
            Write-Host "  User: $($_.user_username)"
            Write-Host "  Slot: $($_.slot_info.slot_number)"
            Write-Host "  Duration: $($_.duration_minutes) minutes"
            Write-Host "  Overtime: $($_.is_overtime)"
        }
    } else {
        Print-Info "No vehicles currently parked"
    }
    
    $passed++
} catch {
    Print-Error "Failed: $($_.Exception.Message)"
    $failed++
}

# Test 7: User's Own Logs
Print-Header "TEST 7: User's Own Check-In/Check-Out Logs"

try {
    $userLogs = Invoke-RestMethod -Uri "$baseUrl/checkin-checkout-logs/my/" `
        -Headers $headers
    
    Print-Success "Retrieved $($userLogs.Count) personal log entries"
    
    if ($userLogs.Count -gt 0) {
        Write-Host "`n📝 Recent Activity:" -ForegroundColor Cyan
        $userLogs | Select-Object -First 3 | ForEach-Object {
            Write-Host "`n  Action: $($_.action_display)"
            Write-Host "  Time: $($_.timestamp)"
            Write-Host "  Vehicle: $($_.vehicle_plate)"
            Write-Host "  Status: $($_.status)"
        }
    } else {
        Print-Info "No personal logs found"
    }
    
    $passed++
} catch {
    Print-Error "Failed: $($_.Exception.Message)"
    $failed++
}

# Test 8: Current Parking Session
Print-Header "TEST 8: Current Parking Session"

try {
    $currentParking = Invoke-RestMethod -Uri "$baseUrl/parking/current/" `
        -Headers $headers
    
    Print-Success "Current parking session found!"
    Write-Host "`n🅿️ Current Parking Details:" -ForegroundColor Cyan
    Write-Host "  • Vehicle: $($currentParking.vehicle_info.number_plate)"
    Write-Host "  • Slot: $($currentParking.slot_info.slot_number)"
    Write-Host "  • Checked In: $($currentParking.checked_in_at)"
    Write-Host "  • Expected Checkout: $($currentParking.expected_checkout)"
    Write-Host "  • Duration: $($currentParking.duration_minutes) minutes"
    Write-Host "  • Overtime: $($currentParking.is_overtime)"
    
    $passed++
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Print-Info "No active parking session (this is OK)"
        $passed++
    } else {
        Print-Error "Failed: $($_.Exception.Message)"
        $failed++
    }
}

# Test 9: Export CSV
Print-Header "TEST 9: Export Logs to CSV"

try {
    $exportUrl = "$baseUrl/admin/checkin-checkout-logs/export/"
    $response = Invoke-WebRequest -Uri $exportUrl -Headers $headers
    
    Print-Success "CSV export successful!"
    $contentType = $response.Headers["Content-Type"]
    Print-Info "Content-Type: $contentType"
    Print-Info "Response size: $($response.Content.Length) bytes"
    
    # Show first few lines
    $lines = $response.Content.Split("`n") | Select-Object -First 3
    Write-Host "`nFirst 3 lines of CSV:" -ForegroundColor Yellow
    $lines | ForEach-Object { Write-Host "  $_" }
    
    $passed++
} catch {
    Print-Error "Failed: $($_.Exception.Message)"
    $failed++
}

# Test 10: Log Detail (if logs exist)
Print-Header "TEST 10: Get Specific Log Detail"

try {
    # Get first log
    $logs = Invoke-RestMethod -Uri "$baseUrl/admin/checkin-checkout-logs/" `
        -Headers $headers
    
    if ($logs.Count -gt 0) {
        $logId = $logs[0].id
        Print-Info "Testing with log ID: $logId"
        
        $logDetail = Invoke-RestMethod -Uri "$baseUrl/admin/checkin-checkout-logs/$logId/" `
            -Headers $headers
        
        Print-Success "Log detail retrieved successfully!"
        Write-Host "`n📋 Log Details:" -ForegroundColor Cyan
        $logDetail | ConvertTo-Json -Depth 3 | Write-Host
        
        $passed++
    } else {
        Print-Info "No logs available to test detail view"
        $passed++
    }
} catch {
    Print-Error "Failed: $($_.Exception.Message)"
    $failed++
}

# Summary
Print-Header "TEST SUMMARY"

Write-Host "Total Tests: $($passed + $failed)"
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Some tests failed. Check the output above." -ForegroundColor Yellow
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "Testing complete!" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan
