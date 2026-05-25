@echo off
echo ============================================
echo   Compiler Sandbox - 迷你编程语言编译沙盒
echo ============================================
echo.

echo [1/3] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies
    exit /b %errorlevel%
)
echo Server dependencies installed successfully.
echo.

echo [2/3] Installing client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo Failed to install client dependencies
    exit /b %errorlevel%
)
echo Client dependencies installed successfully.
echo.

echo [3/3] Building server...
cd ..\server
call npx tsc
if %errorlevel% neq 0 (
    echo Failed to build server
    exit /b %errorlevel%
)
echo Server built successfully.
echo.

echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo To start the system:
echo   Start server: cd server ^&^& npm start
echo   Start client: cd client ^&^& npm run dev
echo.
echo Then open: http://localhost:7001
echo.
pause
