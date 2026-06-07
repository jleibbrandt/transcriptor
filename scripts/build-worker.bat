@echo off
echo Building whisper-worker with PyInstaller...
cd /d "%~dp0..\python"
pip install -r requirements.txt
pyinstaller whisper-worker.spec --noconfirm
echo Done. Output in python\dist\whisper-worker\
pause
