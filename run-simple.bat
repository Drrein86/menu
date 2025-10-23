@echo off
echo Starting Menu Display System...
echo.
cd server
start "Menu Server" cmd /k "node server-mockdata.js"
timeout /t 5 /nobreak >nul
cd ..
cd client
start "Menu CMS" cmd /k "npm run dev"
cd ..
cd display
start "Menu Display" cmd /k "npm run dev"
cd ..
echo.
echo ================================================
echo All services started!
echo ================================================
echo.
echo CMS (Management): http://localhost:3000
echo Display Screen 1: http://localhost:3001/display/demo-screen-001
echo Display Screen 2: http://localhost:3001/display/demo-screen-002
echo.
echo Login: admin / admin123
echo.
pause

