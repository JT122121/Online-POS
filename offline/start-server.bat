@echo off
REM Runs GoOnlinePOS locally via http://localhost, which is what makes the
REM Customer Screen reliable across browsers.
REM (Opening app.html directly with a double-click also works for ringing up
REM sales and printing -- this script is only needed for the Customer Screen.)
setlocal
cd /d "%~dp0"
set PORT=8080

set PYCMD=
where py >nul 2>nul && set PYCMD=py -3
if not defined PYCMD (where python >nul 2>nul && set PYCMD=python)
if not defined PYCMD (where python3 >nul 2>nul && set PYCMD=python3)

if not defined PYCMD (
  echo Python wasn't found on this computer, so the local server can't start.
  echo You can still use GoOnlinePOS by double-clicking app.html directly --
  echo the register works fine that way. The Customer Screen is more
  echo reliable through this launcher, though, so installing Python from
  echo https://python.org is worth it if you need that.
  echo.
  pause
  exit /b 1
)

echo Starting GoOnlinePOS locally on port %PORT% ...
start "GoOnlinePOS Server - close this window to stop" cmd /k "%PYCMD% -m http.server %PORT%"
timeout /t 2 /nobreak >nul
start "" "http://localhost:%PORT%/app.html"

echo.
echo GoOnlinePOS is running at http://localhost:%PORT%/app.html
echo To open the Customer Screen (on a second window, monitor, or a mirrored
echo tablet/TV), open a second browser window to:
echo   http://localhost:%PORT%/customer.html
echo.
echo Close the "GoOnlinePOS Server" window when you're done to stop the server.
pause >nul
