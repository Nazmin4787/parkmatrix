# Activate virtual environment and start Django development server
Write-Host "Activating virtual environment..." -ForegroundColor Green
& "..\parking_env\Scripts\Activate.ps1"

Write-Host ""
Write-Host "Virtual environment activated!" -ForegroundColor Green
Write-Host "To start the Django development server, run:" -ForegroundColor Yellow
Write-Host "python manage.py runserver" -ForegroundColor Cyan
Write-Host ""
Write-Host "To deactivate the virtual environment, run:" -ForegroundColor Yellow
Write-Host "deactivate" -ForegroundColor Cyan
Write-Host ""