# Test Long-Stay Detection Frontend
# Run this script to verify frontend implementation

Write-Host "=== Long-Stay Detection Frontend Test ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the frontend directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Please run this from the frontend directory" -ForegroundColor Red
    exit 1
}

Write-Host "1. Checking required files..." -ForegroundColor Green

$requiredFiles = @(
    "src/services/longStayDetection.js",
    "src/pages/admin/LongStayMonitor.jsx",
    "src/pages/admin/LongStayMonitor.css",
    "src/components/LongStayAlert.jsx",
    "src/components/LongStayAlert.css"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file - MISSING" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "`nError: Some required files are missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Checking MainApp.jsx integration..." -ForegroundColor Green

$mainAppContent = Get-Content "src/MainApp.jsx" -Raw
if ($mainAppContent -match "LongStayMonitor") {
    Write-Host "   ✓ LongStayMonitor imported" -ForegroundColor Green
} else {
    Write-Host "   ✗ LongStayMonitor not imported" -ForegroundColor Red
}

if ($mainAppContent -match "/admin/long-stay") {
    Write-Host "   ✓ Route configured" -ForegroundColor Green
} else {
    Write-Host "   ✗ Route not configured" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Checking Dashboard.jsx integration..." -ForegroundColor Green

$dashboardContent = Get-Content "src/pages/administration/Dashboard.jsx" -Raw
if ($dashboardContent -match "long-stay") {
    Write-Host "   ✓ Long-Stay button added to dashboard" -ForegroundColor Green
} else {
    Write-Host "   ✗ Long-Stay button not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Starting development server..." -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the dev server
npm run dev

Write-Host ""
Write-Host "=== Test URLs ===" -ForegroundColor Cyan
Write-Host "Admin Dashboard: http://localhost:5173/admin/dashboard" -ForegroundColor White
Write-Host "Long-Stay Monitor: http://localhost:5173/admin/long-stay" -ForegroundColor White
Write-Host ""
