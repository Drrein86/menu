@echo off
echo ====================================
echo Starting Menu Display System
echo ====================================
echo.

cd server
start "Server (Port 5000)" cmd /k "node server-mockdata.js"
timeout /t 3 /nobreak >nul

cd ..\client
start "CMS (Port 3000)" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

cd ..\display
start "Display (Port 3001)" cmd /k "npm run dev"

cd ..
timeout /t 5 /nobreak >nul

echo.
echo ====================================
echo All services started!
echo ====================================
echo.
echo CMS:       http://localhost:3000
echo Display 1: http://localhost:3001/demo-screen-001
echo Display 2: http://localhost:3001/demo-screen-002
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:3001/demo-screen-001

echo.
echo Press any key to close this window...
pause >nul

