# Script to create a Windows Task Scheduler task for booking reminders
$ErrorActionPreference = "Stop"

# Task details
$taskName = "ParkingSystem_BookingReminders"
$taskDescription = "Send reminder emails for upcoming parking bookings"
$scriptPath = "C:\Users\nazmi\OneDrive\Desktop\car-parking-system\backend\scripts\run_booking_reminders.ps1"

# Create the task action - run the PowerShell script with the -ExecutionPolicy Bypass parameter
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""

# Create trigger - run daily at 8:00 AM
$trigger = New-ScheduledTaskTrigger -Daily -At 8am

# Set task settings
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

# Register the task (will run under the current user account)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description $taskDescription -Force

Write-Host "Task '$taskName' has been created successfully. It will run daily at 8:00 AM."
Write-Host "Script location: $scriptPath"
