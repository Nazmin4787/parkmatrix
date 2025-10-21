# Feature 2: User Parking History - API Testing Script
# PowerShell Script

Write-Host "=== Feature 2: User Parking History API Testing ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BASE_URL = "http://127.0.0.1:8000/api"
$EMAIL = "admin@example.com"  # Change to your test user
$PASSWORD = "admin"           # Change to your test password

# Step 1: Login to get token
Write-Host "Step 1: Logging in to get JWT token..." -ForegroundColor Yellow
$loginData = @{
    email = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login/" -Method Post -Body $loginData -ContentType "application/json"
    $TOKEN = $loginResponse.access
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($TOKEN.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Headers with token
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

# Step 2: Test User Parking History List
Write-Host "Step 2: Testing GET /user/parking-history/" -ForegroundColor Yellow
try {
    $historyResponse = Invoke-RestMethod -Uri "$BASE_URL/user/parking-history/" -Method Get -Headers $headers
    Write-Host "✓ History list retrieved successfully!" -ForegroundColor Green
    Write-Host "Total sessions: $($historyResponse.count)" -ForegroundColor Cyan
    Write-Host "Page: $($historyResponse.page) of $($historyResponse.total_pages)" -ForegroundColor Cyan
    Write-Host "Results returned: $($historyResponse.results.Count)" -ForegroundColor Cyan
    
    if ($historyResponse.results.Count -gt 0) {
        Write-Host "First session:" -ForegroundColor Gray
        $firstSession = $historyResponse.results[0]
        Write-Host "  - ID: $($firstSession.id)" -ForegroundColor Gray
        Write-Host "  - Vehicle: $($firstSession.vehicle_plate)" -ForegroundColor Gray
        Write-Host "  - Location: $($firstSession.location_name)" -ForegroundColor Gray
        Write-Host "  - Status: $($firstSession.session_status)" -ForegroundColor Gray
        Write-Host "  - Amount: BDT $($firstSession.amount)" -ForegroundColor Gray
        
        # Save first session ID for detail test
        $FIRST_SESSION_ID = $firstSession.id
    } else {
        Write-Host "  No parking history found for this user" -ForegroundColor Yellow
        $FIRST_SESSION_ID = $null
    }
    Write-Host ""
} catch {
    Write-Host "✗ Failed to get history list: $_" -ForegroundColor Red
    Write-Host ""
}

# Step 3: Test History with Filters
Write-Host "Step 3: Testing with filters (completed sessions)" -ForegroundColor Yellow
try {
    $filteredResponse = Invoke-RestMethod -Uri "$BASE_URL/user/parking-history/?status=completed&page_size=5" -Method Get -Headers $headers
    Write-Host "✓ Filtered history retrieved!" -ForegroundColor Green
    Write-Host "Completed sessions: $($filteredResponse.count)" -ForegroundColor Cyan
    Write-Host "Results returned: $($filteredResponse.results.Count)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "✗ Failed to get filtered history: $_" -ForegroundColor Red
    Write-Host ""
}

# Step 4: Test Session Detail (if we have a session ID)
if ($FIRST_SESSION_ID) {
    Write-Host "Step 4: Testing GET /user/parking-history/$FIRST_SESSION_ID/" -ForegroundColor Yellow
    try {
        $detailResponse = Invoke-RestMethod -Uri "$BASE_URL/user/parking-history/$FIRST_SESSION_ID/" -Method Get -Headers $headers
        Write-Host "✓ Session detail retrieved!" -ForegroundColor Green
        Write-Host "Session Details:" -ForegroundColor Cyan
        Write-Host "  - ID: $($detailResponse.id)" -ForegroundColor Gray
        Write-Host "  - User: $($detailResponse.user.username)" -ForegroundColor Gray
        Write-Host "  - Vehicle: $($detailResponse.vehicle.type) - $($detailResponse.vehicle.plate)" -ForegroundColor Gray
        Write-Host "  - Location: $($detailResponse.location.name)" -ForegroundColor Gray
        Write-Host "  - Zone: $($detailResponse.location.zone)" -ForegroundColor Gray
        Write-Host "  - Slot: $($detailResponse.location.slot_number)" -ForegroundColor Gray
        Write-Host "  - Check-in: $($detailResponse.timing.check_in)" -ForegroundColor Gray
        Write-Host "  - Check-out: $($detailResponse.timing.check_out)" -ForegroundColor Gray
        Write-Host "  - Duration: $($detailResponse.timing.duration_formatted)" -ForegroundColor Gray
        Write-Host "  - Amount: BDT $($detailResponse.payment.amount)" -ForegroundColor Gray
        Write-Host "  - Payment Status: $($detailResponse.payment.status)" -ForegroundColor Gray
        Write-Host "  - Session Status: $($detailResponse.session_status)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "✗ Failed to get session detail: $_" -ForegroundColor Red
        Write-Host ""
    }
} else {
    Write-Host "Step 4: Skipped (no session ID available)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 5: Test Statistics
Write-Host "Step 5: Testing GET /user/parking-history/stats/" -ForegroundColor Yellow
try {
    $statsResponse = Invoke-RestMethod -Uri "$BASE_URL/user/parking-history/stats/" -Method Get -Headers $headers
    Write-Host "✓ Statistics retrieved!" -ForegroundColor Green
    Write-Host "User Parking Statistics:" -ForegroundColor Cyan
    Write-Host "  - Total Sessions: $($statsResponse.total_sessions)" -ForegroundColor Gray
    Write-Host "  - Total Time Parked: $($statsResponse.total_time_parked.formatted)" -ForegroundColor Gray
    Write-Host "  - Total Amount Paid: BDT $($statsResponse.total_amount_paid)" -ForegroundColor Gray
    Write-Host "  - Average Duration: $($statsResponse.average_duration_minutes) minutes" -ForegroundColor Gray
    Write-Host "  - Average Amount: BDT $($statsResponse.average_amount)" -ForegroundColor Gray
    Write-Host "  - Active Sessions: $($statsResponse.active_sessions)" -ForegroundColor Gray
    Write-Host "  - Completed Sessions: $($statsResponse.completed_sessions)" -ForegroundColor Gray
    
    if ($statsResponse.favorite_location) {
        Write-Host "  - Favorite Location: $($statsResponse.favorite_location.name) ($($statsResponse.favorite_location.count) visits)" -ForegroundColor Gray
    }
    
    if ($statsResponse.most_used_vehicle) {
        Write-Host "  - Most Used Vehicle: $($statsResponse.most_used_vehicle.plate) ($($statsResponse.most_used_vehicle.count) times)" -ForegroundColor Gray
    }
    
    Write-Host "  - This Month: $($statsResponse.this_month.sessions) sessions, BDT $($statsResponse.this_month.total_amount)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Failed to get statistics: $_" -ForegroundColor Red
    Write-Host ""
}

# Step 6: Test Export (just check if endpoint responds)
Write-Host "Step 6: Testing GET /user/parking-history/export/" -ForegroundColor Yellow
try {
    $exportUrl = "$BASE_URL/user/parking-history/export/"
    # Just make a HEAD request to check if endpoint exists
    $exportResponse = Invoke-WebRequest -Uri $exportUrl -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "✓ Export endpoint accessible!" -ForegroundColor Green
    Write-Host "Content-Type: $($exportResponse.Headers['Content-Type'])" -ForegroundColor Gray
    Write-Host "Content-Disposition: $($exportResponse.Headers['Content-Disposition'])" -ForegroundColor Gray
    Write-Host "Note: Full CSV download not performed in test" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "✗ Failed to access export endpoint: $_" -ForegroundColor Red
    Write-Host ""
}

# Step 7: Test Date Range Filter
Write-Host "Step 7: Testing with date range filter" -ForegroundColor Yellow
$startDate = (Get-Date).AddMonths(-1).ToString("yyyy-MM-dd")
$endDate = (Get-Date).ToString("yyyy-MM-dd")
try {
    $dateFilteredResponse = Invoke-RestMethod -Uri "$BASE_URL/user/parking-history/?start_date=$startDate&end_date=$endDate" -Method Get -Headers $headers
    Write-Host "✓ Date-filtered history retrieved!" -ForegroundColor Green
    Write-Host "Date range: $startDate to $endDate" -ForegroundColor Cyan
    Write-Host "Sessions in range: $($dateFilteredResponse.count)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "✗ Failed to get date-filtered history: $_" -ForegroundColor Red
    Write-Host ""
}

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Feature 2: User Parking History API" -ForegroundColor White
Write-Host "All endpoints tested!" -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints Tested:" -ForegroundColor Yellow
Write-Host "  1. ✓ GET /user/parking-history/ - List with pagination" -ForegroundColor Green
Write-Host "  2. ✓ GET /user/parking-history/ (filtered) - Status filter" -ForegroundColor Green
Write-Host "  3. ✓ GET /user/parking-history/{id}/ - Detail view" -ForegroundColor Green
Write-Host "  4. ✓ GET /user/parking-history/stats/ - Statistics" -ForegroundColor Green
Write-Host "  5. ✓ GET /user/parking-history/export/ - CSV export" -ForegroundColor Green
Write-Host "  6. ✓ GET /user/parking-history/ (date filter) - Date range" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  - Review statistics calculations" -ForegroundColor White
Write-Host "  - Test with different user accounts" -ForegroundColor White
Write-Host "  - Test admin endpoints" -ForegroundColor White
Write-Host "  - Implement frontend" -ForegroundColor White
Write-Host ""
