@echo off
REM Admin Portal Dev Server - Windows
REM This script starts the admin portal on http://localhost:5175

echo ========================================
echo MulundStays Admin Portal - Dev Server
echo ========================================
echo.
echo Starting backend on http://localhost:5000
echo Starting admin portal on http://localhost:5175
echo.
echo Press Ctrl+C to stop.
echo.

call npm run dev:admin

pause
