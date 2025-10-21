# Simple Admin Endpoint Test

$baseUrl = "http://localhost:8000"

Write-Host "=== Testing Admin Users Endpoint ===" -ForegroundColor Cyan

# Login
Write-Host "`nLogging in as admin..." -ForegroundColor Yellow
$loginUrl = "$baseUrl/api/auth/login/"
$loginBody = '{"email":"naaz@example.com","password":"admin123"}'

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "Username: $($loginResponse.user.username)" -ForegroundColor Cyan
    Write-Host "Email: $($loginResponse.user.email)" -ForegroundColor Cyan
    Write-Host "Role: $($loginResponse.user.role)" -ForegroundColor Cyan
    Write-Host "Is Staff: $($loginResponse.user.is_staff)" -ForegroundColor Cyan
    
    # Test users endpoint
    Write-Host "`nTesting /api/admin/users/..." -ForegroundColor Yellow
    $usersUrl = "$baseUrl/api/admin/users/"
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $usersResponse = Invoke-RestMethod -Uri $usersUrl -Method Get -Headers $headers
    Write-Host "SUCCESS! Got $($usersResponse.count) users" -ForegroundColor Green
    
    Write-Host "`nFirst 5 users:" -ForegroundColor Cyan
    $usersResponse.users | Select-Object -First 5 | ForEach-Object {
        Write-Host "  $($_.id). $($_.username) - $($_.email) - $($_.role)" -ForegroundColor White
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
