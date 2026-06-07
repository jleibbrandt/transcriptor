@echo off
echo === Building Transcriptor (Full Installer) ===
echo Includes: Electron + Python worker + FFmpeg
echo Does NOT include models (downloaded on first use)

echo.
echo [1/3] Building Python worker...
cd /d "%~dp0..\python"
pip install -r requirements.txt
pyinstaller whisper-worker.spec --noconfirm

echo.
echo [2/3] Building Electron app...
cd /d "%~dp0.."
call npm install
call npm run build

echo.
echo [3/3] Packaging with electron-builder...
call npx electron-builder --config electron-builder-full.json

echo.
echo === Full build complete ===
echo Output in release/
pause
