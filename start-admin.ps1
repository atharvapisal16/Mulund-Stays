# Admin Portal Dev Server - PowerShell
# This script starts the admin portal on http://localhost:5175

Write-Host "========================================"
Write-Host "MulundStays Admin Portal - Dev Server"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting backend on http://localhost:5000" -ForegroundColor Green
Write-Host "Starting admin portal on http://localhost:5175" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

npm run dev:admin

Read-Host "Press Enter to exit"
