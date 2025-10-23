# Quick API Test Script - Parking Rates
# Tests only public endpoints (no authentication required)

$baseUrl = "http://localhost:8000/api"

Write-Host "`n=== QUICK API TESTS ===" -ForegroundColor Cyan

# Test 1: Get Default Rates
Write-Host "`n1. Testing Default Rates..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/rates/defaults/" -Method GET
    Write-Host "✓ Success! Retrieved $($response.count) default rates" -ForegroundColor Green
    Write-Host "`nDefault Rates:" -ForegroundColor Cyan
    foreach ($rate in $response.data) {
        Write-Host "  • $($rate.vehicle_type_display): ₹$($rate.hourly_rate)/hr, ₹$($rate.daily_rate)/day" -ForegroundColor White
    }
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

# Test 2: Calculate Fee for 2-Wheeler (3 hours)
Write-Host "`n2. Calculating Fee: 2-Wheeler - 3 hours..." -ForegroundColor Yellow
try {
    $body = @{
        vehicle_type = "2-wheeler"
        hours = 3
        days = 0
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/rates/calculate-fee/" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Success! Total Fee: ₹$($response.data.total_fee)" -ForegroundColor Green
    Write-Host "  Rate Plan: $($response.data.rate_name)" -ForegroundColor White
    Write-Host "  Hourly Rate: ₹$($response.data.hourly_rate)/hr" -ForegroundColor White
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

# Test 3: Calculate Fee for 4-Wheeler (1 day)
Write-Host "`n3. Calculating Fee: 4-Wheeler - 1 day..." -ForegroundColor Yellow
try {
    $body = @{
        vehicle_type = "4-wheeler"
        hours = 0
        days = 1
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/rates/calculate-fee/" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Success! Total Fee: ₹$($response.data.total_fee)" -ForegroundColor Green
    Write-Host "  Daily Rate: ₹$($response.data.daily_rate)/day" -ForegroundColor White
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

# Test 4: Calculate Fee for Electric Vehicle (5 hours)
Write-Host "`n4. Calculating Fee: Electric Vehicle - 5 hours..." -ForegroundColor Yellow
try {
    $body = @{
        vehicle_type = "electric"
        hours = 5
        days = 0
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/rates/calculate-fee/" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Success! Total Fee: ₹$($response.data.total_fee)" -ForegroundColor Green
    Write-Host "  Rate Plan: $($response.data.rate_name)" -ForegroundColor White
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

# Test 5: Calculate Fee for Heavy Vehicle (2 days)
Write-Host "`n5. Calculating Fee: Heavy Vehicle - 2 days..." -ForegroundColor Yellow
try {
    $body = @{
        vehicle_type = "heavy"
        hours = 0
        days = 2
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/rates/calculate-fee/" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Success! Total Fee: ₹$($response.data.total_fee)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

Write-Host "`n=== TESTS COMPLETED ===" -ForegroundColor Cyan
Write-Host "✅ All public API endpoints tested!`n" -ForegroundColor Green
