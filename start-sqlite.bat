@echo off
chcp 65001 > nul
title Menu Display System - SQLite

echo ====================================
echo Starting Menu Display System (SQLite)
echo ====================================
echo.

echo Starting Server (SQLite)...
start /B powershell -NoExit -Command "cd '%~dp0server'; node server-sqlite.js"
timeout /t 3 > nul

echo Starting Client (CMS)...
start /B powershell -NoExit -Command "cd '%~dp0client'; npm run dev"
timeout /t 3 > nul

echo Starting Display...
start /B powershell -NoExit -Command "cd '%~dp0display'; npm run dev"
timeout /t 3 > nul

echo.
echo ====================================
echo All services started! (SQLite)
echo ====================================
echo.
echo CMS:       http://localhost:3000
echo Display 1: http://localhost:3001/demo-screen-001
echo Display 2: http://localhost:3001/demo-screen-002
echo.
echo Press any key to open browser...
pause > nul

start http://localhost:3000
start http://localhost:3001/demo-screen-001
start http://localhost:3001/demo-screen-002

echo.
echo Press any key to close this window...
pause > nul

