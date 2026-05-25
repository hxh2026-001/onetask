@echo off
echo ============================================
echo   Starting Compiler Sandbox System
echo ============================================
echo.

echo Starting Express server on port 7002...
start "Compiler Server" cmd /k "cd /d %~dp0server && node dist/index.js"

timeout /t 3 /nobreak > nul

echo Starting Next.js client on port 7001...
start "Compiler Client" cmd /k "cd /d %~dp0client && npx next dev -p 7001"

echo.
echo ============================================
echo   System Starting...
echo ============================================
echo.
echo Client: http://localhost:7001
echo Server API: http://localhost:7002/api
echo.
echo Close this window to stop the system.
pause
