@echo off
echo === Building Transcriptor (Lite Installer) ===
echo Includes: Electron only
echo Downloads Python worker + FFmpeg on first launch

echo.
echo [1/2] Building Electron app...
cd /d "%~dp0.."
call npm install
call npm run build

echo.
echo [2/2] Packaging with electron-builder (lite)...
call npx electron-builder --config electron-builder-lite.json

echo.
echo === Lite build complete ===
echo Output in release/
pause
