# Frontend Deployment Script for Car Parking System
# Run this script from the project root directory

Write-Host "🚀 Starting Frontend Deployment..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location "frontend"

# Install dependencies if needed
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build for production
Write-Host "🔨 Building for production..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host "📁 Production files are in: frontend/dist/" -ForegroundColor Cyan

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
    Write-Host "🌐 Vercel CLI detected. Ready to deploy!" -ForegroundColor Green
    Write-Host "Run 'vercel --prod' to deploy to production" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️  Vercel CLI not found. Install it with: npm install -g vercel" -ForegroundColor Yellow
}

Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update env.production.example with your backend URL" -ForegroundColor White
Write-Host "2. Copy env.production.example to .env.production" -ForegroundColor White
Write-Host "3. Run 'vercel --prod' to deploy" -ForegroundColor White

# Return to project root
Set-Location ".."
