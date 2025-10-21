# Debug Admin Access - Check Token and User Status

$baseUrl = "http://localhost:8000"

Write-Host "`n=== DEBUGGING ADMIN ACCESS ===" -ForegroundColor Cyan

# Check if we can access the endpoint without auth
Write-Host "`n[Test 1] Checking endpoint without authentication..." -ForegroundColor Yellow
$usersUrl = "$baseUrl/api/admin/users/"

try {
    $response = Invoke-WebRequest -Uri $usersUrl -Method Get -UseBasicParsing
    Write-Host "Unexpected: Endpoint accessible without auth!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✓ Correct: 401 Unauthorized (auth required)" -ForegroundColor Green
    } else {
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
    }
}

# Try to login and check user role
Write-Host "`n[Test 2] Attempting admin login..." -ForegroundColor Yellow
$loginUrl = "$baseUrl/api/auth/login/"

# Try different admin accounts
$adminAccounts = @(
    @{ email = "naaz@example.com"; password = "admin123" },
    @{ email = "admin1@example.com"; password = "admin123" },
    @{ email = "admin3@example.com"; password = "admin123" }
)

$validToken = $null
$validUser = $null

foreach ($account in $adminAccounts) {
    Write-Host "`nTrying: $($account.email)..." -ForegroundColor Gray
    $loginBody = @{
        email = $account.email
        password = $account.password
    } | ConvertTo-Json

    try {
        $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
        $validToken = $loginResponse.access
        $validUser = $account.email
        Write-Host "✓ Login successful!" -ForegroundColor Green
        Write-Host "User: $($loginResponse.user.username)" -ForegroundColor Cyan
        Write-Host "Email: $($loginResponse.user.email)" -ForegroundColor Cyan
        Write-Host "Role: $($loginResponse.user.role)" -ForegroundColor Cyan
        Write-Host "Is Staff: $($loginResponse.user.is_staff)" -ForegroundColor Cyan
        break
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if (-not $validToken) {
    Write-Host "`n✗ Could not login with any admin account!" -ForegroundColor Red
    Write-Host "Please provide valid admin credentials." -ForegroundColor Yellow
    exit
}

# Test the admin/users endpoint with valid token
Write-Host "`n[Test 3] Testing /api/admin/users/ with token..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $validToken"
    "Content-Type" = "application/json"
}

try {
    $usersResponse = Invoke-RestMethod -Uri $usersUrl -Method Get -Headers $headers
    Write-Host "✓ SUCCESS! Endpoint works correctly!" -ForegroundColor Green
    Write-Host "Total users: $($usersResponse.count)" -ForegroundColor Cyan
    
    Write-Host "`nFirst 5 users:" -ForegroundColor Cyan
    $usersResponse.users | Select-Object -First 5 | ForEach-Object {
        Write-Host "  - $($_.username) ($($_.email)) - $($_.role)" -ForegroundColor White
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✗ Request failed with status: $statusCode" -ForegroundColor Red
    
    if ($statusCode -eq 403) {
        Write-Host "403 FORBIDDEN - User is authenticated but not admin!" -ForegroundColor Red
        Write-Host "`nThis means:" -ForegroundColor Yellow
        Write-Host "  1. The token is valid (not 401)" -ForegroundColor Yellow
        Write-Host "  2. But the user is not recognized as admin" -ForegroundColor Yellow
        Write-Host "`nPossible causes:" -ForegroundColor Yellow
        Write-Host "  - User is_staff field is False in database" -ForegroundColor Yellow
        Write-Host "  - User was logged in before being made admin" -ForegroundColor Yellow
        Write-Host "`nSolution: Re-login after confirming admin status" -ForegroundColor Yellow
    }
    
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Login User: $validUser" -ForegroundColor White
Write-Host "Token exists: Yes" -ForegroundColor White
Write-Host "Backend endpoint: /api/admin/users/" -ForegroundColor White
Write-Host "If you got 403, the user may not have admin status in database." -ForegroundColor Yellow
