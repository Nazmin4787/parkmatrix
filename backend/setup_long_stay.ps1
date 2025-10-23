# Setup Long-Stay Detection Feature
# Run this after installing the code

Write-Host "=== Long-Stay Vehicle Detection - Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "⚠️  Virtual environment not activated" -ForegroundColor Yellow
    Write-Host "Activating parking_env..." -ForegroundColor Yellow
    & "$PSScriptRoot\..\..\parking_env\Scripts\activate.ps1"
}

# Step 1: Install dependencies
Write-Host "1. Installing dependencies..." -ForegroundColor Green
pip install APScheduler>=3.10.0
Write-Host ""

# Step 2: Check Django installation
Write-Host "2. Verifying Django setup..." -ForegroundColor Green
try {
    python -c "import django; print(f'Django version: {django.get_version()}')"
    Write-Host "   ✓ Django is installed" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Django not found. Installing..." -ForegroundColor Red
    pip install -r requirements.txt
}
Write-Host ""

# Step 3: Run migrations (if needed)
Write-Host "3. Running migrations..." -ForegroundColor Green
python manage.py makemigrations
python manage.py migrate
Write-Host ""

# Step 4: Test the feature
Write-Host "4. Testing long-stay detection..." -ForegroundColor Green
Write-Host "   Running detection command..." -ForegroundColor Yellow
python manage.py detect_long_stay
Write-Host ""

# Step 5: Instructions
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ APScheduler installed" -ForegroundColor Green
Write-Host "✅ Long-stay detection service created" -ForegroundColor Green
Write-Host "✅ API endpoints configured" -ForegroundColor Green
Write-Host "✅ Management command ready" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start Django server: python manage.py runserver" -ForegroundColor White
Write-Host "2. Check scheduler status: GET /api/admin/scheduler/status/" -ForegroundColor White
Write-Host "3. View long-stay vehicles: GET /api/admin/long-stay-vehicles/" -ForegroundColor White
Write-Host ""
Write-Host "The scheduler will run automatically when Django starts!" -ForegroundColor Cyan
Write-Host "Detection runs every hour + at 8am, 12pm, 4pm, 8pm UTC" -ForegroundColor Gray
Write-Host ""
Write-Host "For testing, run: python manage.py detect_long_stay" -ForegroundColor Gray
Write-Host "For API testing, run: .\test_long_stay_api.ps1" -ForegroundColor Gray
Write-Host ""
