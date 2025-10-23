# PowerShell script to test Parking Rate Management APIs
# Tests all endpoints including public and admin endpoints

$baseUrl = "http://localhost:8000/api"
$adminToken = ""  # Will be populated after login

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   PARKING RATE API TESTING SUITE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Function to display test result
function Show-TestResult {
    param($TestName, $Status, $StatusCode, $Message)
    $color = if ($Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$Status] " -ForegroundColor $color -NoNewline
    Write-Host "$TestName " -NoNewline
    Write-Host "[$StatusCode]" -ForegroundColor Yellow
    if ($Message) {
        Write-Host "    → $Message" -ForegroundColor Gray
    }
}

# Function to make API request
function Invoke-ApiRequest {
    param($Method, $Url, $Body, $Token, $ContentType = "application/json")
    
    $headers = @{
        "Content-Type" = $ContentType
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json) -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -ErrorAction Stop
        }
        return @{
            Success = $true
            StatusCode = 200
            Data = $response
        }
    } catch {
        return @{
            Success = $false
            StatusCode = $_.Exception.Response.StatusCode.value__
            Error = $_.Exception.Message
        }
    }
}

Write-Host "`n=== 1. PUBLIC ENDPOINTS (No Authentication) ===" -ForegroundColor Yellow

# Test 1: Get Default Rates
Write-Host "`nTest 1: Get Default Rates for All Vehicle Types" -ForegroundColor White
$result = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/rates/defaults/"
if ($result.Success) {
    Show-TestResult -TestName "GET /rates/defaults/" -Status "PASS" -StatusCode $result.StatusCode -Message "Retrieved $($result.Data.count) default rates"
    Write-Host "`n    Default Rates:" -ForegroundColor Cyan
    foreach ($rate in $result.Data.data) {
        Write-Host "    • $($rate.rate_name) - $($rate.vehicle_type_display): ₹$($rate.hourly_rate)/hr" -ForegroundColor White
    }
} else {
    Show-TestResult -TestName "GET /rates/defaults/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
}

# Test 2: Calculate Fee - 2-Wheeler (3 hours)
Write-Host "`nTest 2: Calculate Fee - 2-Wheeler (3 hours)" -ForegroundColor White
$feeData = @{
    vehicle_type = "2-wheeler"
    hours = 3
    days = 0
}
$result = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/rates/calculate-fee/" -Body $feeData
if ($result.Success) {
    $fee = $result.Data.data
    Show-TestResult -TestName "POST /rates/calculate-fee/" -Status "PASS" -StatusCode $result.StatusCode -Message "Fee: ₹$($fee.total_fee)"
    Write-Host "`n    Fee Breakdown:" -ForegroundColor Cyan
    Write-Host "    • Rate Plan: $($fee.rate_name)" -ForegroundColor White
    Write-Host "    • Vehicle Type: $($fee.vehicle_type)" -ForegroundColor White
    Write-Host "    • Hourly Rate: ₹$($fee.hourly_rate)/hr" -ForegroundColor White
    Write-Host "    • Duration: $($fee.hours) hours" -ForegroundColor White
    Write-Host "    • Total Fee: ₹$($fee.total_fee)" -ForegroundColor Green
} else {
    Show-TestResult -TestName "POST /rates/calculate-fee/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
}

# Test 3: Calculate Fee - 4-Wheeler (1 day)
Write-Host "`nTest 3: Calculate Fee - 4-Wheeler (1 day)" -ForegroundColor White
$feeData = @{
    vehicle_type = "4-wheeler"
    hours = 0
    days = 1
}
$result = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/rates/calculate-fee/" -Body $feeData
if ($result.Success) {
    $fee = $result.Data.data
    Show-TestResult -TestName "POST /rates/calculate-fee/" -Status "PASS" -StatusCode $result.StatusCode -Message "Fee: ₹$($fee.total_fee)"
    Write-Host "    • Daily Rate: ₹$($fee.daily_rate)/day" -ForegroundColor White
} else {
    Show-TestResult -TestName "POST /rates/calculate-fee/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
}

# Test 4: Calculate Fee - Electric Vehicle (5 hours)
Write-Host "`nTest 4: Calculate Fee - Electric Vehicle (5 hours)" -ForegroundColor White
$feeData = @{
    vehicle_type = "electric"
    hours = 5
    days = 0
}
$result = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/rates/calculate-fee/" -Body $feeData
if ($result.Success) {
    $fee = $result.Data.data
    Show-TestResult -TestName "POST /rates/calculate-fee/" -Status "PASS" -StatusCode $result.StatusCode -Message "Fee: ₹$($fee.total_fee)"
} else {
    Show-TestResult -TestName "POST /rates/calculate-fee/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
}

# Test 5: Calculate Fee - Invalid Input (no duration)
Write-Host "`nTest 5: Calculate Fee - Invalid Input (Testing Validation)" -ForegroundColor White
$feeData = @{
    vehicle_type = "2-wheeler"
    hours = 0
    days = 0
}
$result = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/rates/calculate-fee/" -Body $feeData
if (-not $result.Success -and $result.StatusCode -eq 400) {
    Show-TestResult -TestName "POST /rates/calculate-fee/ (Invalid)" -Status "PASS" -StatusCode $result.StatusCode -Message "Validation working correctly"
} else {
    Show-TestResult -TestName "POST /rates/calculate-fee/ (Invalid)" -Status "FAIL" -StatusCode $result.StatusCode -Message "Should have failed with 400"
}

Write-Host "`n=== 2. ADMIN LOGIN ===" -ForegroundColor Yellow

# Admin Login (Replace with your admin credentials)
Write-Host "`nAttempting Admin Login..." -ForegroundColor White
Write-Host "Please enter admin credentials:" -ForegroundColor Cyan
$adminEmail = Read-Host "Email"
$adminPassword = Read-Host "Password" -AsSecureString
$adminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword))

$loginData = @{
    email = $adminEmail
    password = $adminPasswordPlain
}

$result = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/auth/login/" -Body $loginData
if ($result.Success) {
    $adminToken = $result.Data.access
    Show-TestResult -TestName "POST /auth/login/" -Status "PASS" -StatusCode $result.StatusCode -Message "Admin logged in successfully"
    Write-Host "    Token: $($adminToken.Substring(0, 20))..." -ForegroundColor Gray
} else {
    Show-TestResult -TestName "POST /auth/login/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
    Write-Host "`n⚠️  Admin login failed. Skipping admin-only tests." -ForegroundColor Red
    exit
}

Write-Host "`n=== 3. AUTHENTICATED ENDPOINTS ===" -ForegroundColor Yellow

# Test 6: Get All Active Rates
Write-Host "`nTest 6: Get All Active Rates (Authenticated)" -ForegroundColor White
$result = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/rates/active/" -Token $adminToken
if ($result.Success) {
    Show-TestResult -TestName "GET /rates/active/" -Status "PASS" -StatusCode $result.StatusCode -Message "Retrieved $($result.Data.count) active rates"
} else {
    Show-TestResult -TestName "GET /rates/active/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
}

Write-Host "`n=== 4. ADMIN ENDPOINTS ===" -ForegroundColor Yellow

# Test 7: List All Rates (Admin)
Write-Host "`nTest 7: List All Rates (Admin)" -ForegroundColor White
$result = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/admin/rates/" -Token $adminToken
if ($result.Success) {
    $rateCount = $result.Data.count
    Show-TestResult -TestName "GET /admin/rates/" -Status "PASS" -StatusCode $result.StatusCode -Message "Retrieved $rateCount rates"
    Write-Host "`n    All Rates:" -ForegroundColor Cyan
    foreach ($rate in $result.Data.results) {
        $status = if ($rate.is_active) { "✓" } else { "✗" }
        $default = if ($rate.is_default) { "[DEFAULT]" } else { "" }
        Write-Host "    $status $($rate.id). $($rate.rate_name) $default - ₹$($rate.hourly_rate)/hr" -ForegroundColor White
    }
} else {
    Show-TestResult -TestName "GET /admin/rates/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
}

# Test 8: Create New Rate (Admin)
Write-Host "`nTest 8: Create New Test Rate (Admin)" -ForegroundColor White
$newRate = @{
    rate_name = "Test Weekend Special"
    description = "Special weekend rate for testing"
    vehicle_type = "2-wheeler"
    hourly_rate = 20.00
    daily_rate = 180.00
    weekend_rate = 25.00
    is_active = $true
    is_default = $false
}
$result = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/admin/rates/" -Body $newRate -Token $adminToken
if ($result.Success) {
    $createdRate = $result.Data.data
    $createdRateId = $createdRate.id
    Show-TestResult -TestName "POST /admin/rates/" -Status "PASS" -StatusCode $result.StatusCode -Message "Created rate ID: $createdRateId"
    Write-Host "    • Name: $($createdRate.rate_name)" -ForegroundColor White
    Write-Host "    • Type: $($createdRate.vehicle_type_display)" -ForegroundColor White
    Write-Host "    • Hourly: ₹$($createdRate.hourly_rate)/hr" -ForegroundColor White
    Write-Host "    • Weekend: ₹$($createdRate.weekend_rate)/hr" -ForegroundColor White
    
    # Store for later tests
    $script:testRateId = $createdRateId
} else {
    Show-TestResult -TestName "POST /admin/rates/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
}

# Test 9: Get Specific Rate (Admin)
if ($script:testRateId) {
    Write-Host "`nTest 9: Get Specific Rate Details (Admin)" -ForegroundColor White
    $result = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/admin/rates/$($script:testRateId)/" -Token $adminToken
    if ($result.Success) {
        Show-TestResult -TestName "GET /admin/rates/$($script:testRateId)/" -Status "PASS" -StatusCode $result.StatusCode -Message "Retrieved rate details"
    } else {
        Show-TestResult -TestName "GET /admin/rates/$($script:testRateId)/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
    }
}

# Test 10: Update Rate (Admin)
if ($script:testRateId) {
    Write-Host "`nTest 10: Update Rate (Admin)" -ForegroundColor White
    $updateData = @{
        rate_name = "Test Weekend Special (Updated)"
        description = "Updated description for testing"
        vehicle_type = "2-wheeler"
        hourly_rate = 22.00
        daily_rate = 190.00
        weekend_rate = 28.00
        is_active = $true
        is_default = $false
    }
    $result = Invoke-ApiRequest -Method "PUT" -Url "$baseUrl/admin/rates/$($script:testRateId)/" -Body $updateData -Token $adminToken
    if ($result.Success) {
        Show-TestResult -TestName "PUT /admin/rates/$($script:testRateId)/" -Status "PASS" -StatusCode $result.StatusCode -Message "Rate updated successfully"
        Write-Host "    • New Hourly Rate: ₹$($result.Data.data.hourly_rate)/hr" -ForegroundColor White
    } else {
        Show-TestResult -TestName "PUT /admin/rates/$($script:testRateId)/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
    }
}

# Test 11: Get Rates by Vehicle Type
Write-Host "`nTest 11: Get Rates by Vehicle Type (2-wheeler)" -ForegroundColor White
$result = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/admin/rates/by-vehicle/2-wheeler/" -Token $adminToken
if ($result.Success) {
    Show-TestResult -TestName "GET /admin/rates/by-vehicle/2-wheeler/" -Status "PASS" -StatusCode $result.StatusCode -Message "Retrieved $($result.Data.count) rates"
} else {
    Show-TestResult -TestName "GET /admin/rates/by-vehicle/2-wheeler/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
}

# Test 12: Filter Rates (Active Only)
Write-Host "`nTest 12: Filter Rates (Active Only)" -ForegroundColor White
$result = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/admin/rates/?is_active=true" -Token $adminToken
if ($result.Success) {
    Show-TestResult -TestName "GET /admin/rates/?is_active=true" -Status "PASS" -StatusCode $result.StatusCode -Message "Retrieved $($result.Data.count) active rates"
} else {
    Show-TestResult -TestName "GET /admin/rates/?is_active=true" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
}

# Test 13: Delete Rate (Admin)
if ($script:testRateId) {
    Write-Host "`nTest 13: Delete Test Rate (Admin)" -ForegroundColor White
    $result = Invoke-ApiRequest -Method "DELETE" -Url "$baseUrl/admin/rates/$($script:testRateId)/" -Token $adminToken
    if ($result.Success) {
        Show-TestResult -TestName "DELETE /admin/rates/$($script:testRateId)/" -Status "PASS" -StatusCode $result.StatusCode -Message "Rate deleted successfully"
    } else {
        Show-TestResult -TestName "DELETE /admin/rates/$($script:testRateId)/" -Status "FAIL" -StatusCode $result.StatusCode -Message $result.Error
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "      TEST SUITE COMPLETED" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✅ All tests completed! Check results above." -ForegroundColor Green
