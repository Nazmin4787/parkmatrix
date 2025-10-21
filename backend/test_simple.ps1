# Simple PowerShell Test Script for Check-In/Check-Out Logs API

$baseUrl = "http://127.0.0.1:8000/api"
$email = "admin1@example.com"
$password = "admin123"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CHECK-IN/CHECK-OUT LOGS API TEST" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Login
Write-Host "`nStep 1: Logging in..." -ForegroundColor Yellow
$body = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login/" -Method Post -Body $body -ContentType "application/json"
    $token = $loginResponse.access
    Write-Host "SUCCESS: Logged in as $($loginResponse.user.username) ($($loginResponse.user.role))" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

$headers = @{
    Authorization = "Bearer $token"
}

# Test 1: List logs
Write-Host "`nStep 2: Testing list all logs..." -ForegroundColor Yellow
try {
    $logs = Invoke-RestMethod -Uri "$baseUrl/admin/checkin-checkout-logs/" -Headers $headers
    Write-Host "SUCCESS: Retrieved $($logs.Count) log entries" -ForegroundColor Green
    if ($logs.Count -gt 0) {
        Write-Host "Sample: $($logs[0].action_display) at $($logs[0].timestamp)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Statistics
Write-Host "`nStep 3: Testing statistics..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/admin/checkin-checkout-logs/stats/" -Headers $headers
    Write-Host "SUCCESS: Statistics retrieved" -ForegroundColor Green
    Write-Host "  Total Check-Ins: $($stats.total_check_ins)" -ForegroundColor Cyan
    Write-Host "  Total Check-Outs: $($stats.total_check_outs)" -ForegroundColor Cyan
    Write-Host "  Currently Parked: $($stats.currently_parked)" -ForegroundColor Cyan
    Write-Host "  Average Duration: $($stats.average_parking_duration_hours) hours" -ForegroundColor Cyan
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Currently parked
Write-Host "`nStep 4: Testing currently parked vehicles..." -ForegroundColor Yellow
try {
    $parked = Invoke-RestMethod -Uri "$baseUrl/admin/currently-parked/" -Headers $headers
    Write-Host "SUCCESS: Found $($parked.Count) currently parked vehicles" -ForegroundColor Green
    if ($parked.Count -gt 0) {
        Write-Host "  First vehicle: $($parked[0].vehicle_info.number_plate) in slot $($parked[0].slot_info.slot_number)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: User logs
Write-Host "`nStep 5: Testing user own logs..." -ForegroundColor Yellow
try {
    $userLogs = Invoke-RestMethod -Uri "$baseUrl/checkin-checkout-logs/my/" -Headers $headers
    Write-Host "SUCCESS: Retrieved $($userLogs.Count) personal log entries" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Current parking
Write-Host "`nStep 6: Testing current parking session..." -ForegroundColor Yellow
try {
    $current = Invoke-RestMethod -Uri "$baseUrl/parking/current/" -Headers $headers
    Write-Host "SUCCESS: Current parking session found" -ForegroundColor Green
    Write-Host "  Vehicle: $($current.vehicle_info.number_plate)" -ForegroundColor Cyan
    Write-Host "  Duration: $($current.duration_minutes) minutes" -ForegroundColor Cyan
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "INFO: No active parking session (this is OK)" -ForegroundColor Yellow
    } else {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Filter test
Write-Host "`nStep 7: Testing filters..." -ForegroundColor Yellow
try {
    $filtered = Invoke-RestMethod -Uri "$baseUrl/admin/checkin-checkout-logs/?status=success" -Headers $headers
    Write-Host "SUCCESS: Filter by status works, found $($filtered.Count) entries" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Export CSV
Write-Host "`nStep 8: Testing CSV export..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/admin/checkin-checkout-logs/export/" -Headers $headers
    Write-Host "SUCCESS: CSV export works, size: $($response.Content.Length) bytes" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "TESTING COMPLETE!" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan
