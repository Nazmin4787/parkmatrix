# Script to run the Django management command for sending booking reminders
$ErrorActionPreference = "Stop"

# Log file path
$logFile = "C:\Users\nazmi\OneDrive\Desktop\car-parking-system\backend\logs\booking_reminders.log"

# Ensure log directory exists
$logDir = Split-Path -Parent $logFile
if (-not (Test-Path -Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force
}

# Get current timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
    # Navigate to project directory
    Set-Location -Path "C:\Users\nazmi\OneDrive\Desktop\car-parking-system\backend"
    
    # Activate virtual environment
    & "C:\Users\nazmi\OneDrive\Desktop\car-parking-system\myenvv\Scripts\Activate.ps1"
    
    # Run the management command
    Write-Output "$timestamp - Starting booking reminder job..." | Out-File -Append $logFile
    python manage.py send_booking_reminders --hours 24 2>&1 | Out-File -Append $logFile
    
    # Log success
    Write-Output "$timestamp - Booking reminder job completed successfully." | Out-File -Append $logFile
} 
catch {
    # Log any errors
    Write-Output "$timestamp - ERROR: $($_.Exception.Message)" | Out-File -Append $logFile
    exit 1
}
