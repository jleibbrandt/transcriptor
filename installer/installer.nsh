!macro customInstall
  ; --- Download Python Embeddable ---
  DetailPrint "Downloading Python embeddable..."
  NScurl::http GET "https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip" "$INSTDIR\resources\python-embed.zip" /CANCEL /RESUME /END
  Pop $0
  ${If} $0 != "OK"
    MessageBox MB_ICONSTOP "Failed to download Python: $0"
    Abort
  ${EndIf}

  ; Extract Python
  DetailPrint "Extracting Python..."
  CreateDirectory "$INSTDIR\resources\python"
  nsisunz::UnzipToLog "$INSTDIR\resources\python-embed.zip" "$INSTDIR\resources\python"
  Pop $0
  ${If} $0 != "success"
    MessageBox MB_ICONSTOP "Failed to extract Python: $0"
    Abort
  ${EndIf}
  Delete "$INSTDIR\resources\python-embed.zip"

  ; Enable pip in embeddable Python (uncomment import site in ._pth file)
  DetailPrint "Configuring Python..."
  FileOpen $0 "$INSTDIR\resources\python\python311._pth" w
  FileWrite $0 "python311.zip$\r$\n"
  FileWrite $0 ".$\r$\n"
  FileWrite $0 "import site$\r$\n"
  FileClose $0

  ; Download get-pip.py
  DetailPrint "Downloading pip..."
  NScurl::http GET "https://bootstrap.pypa.io/get-pip.py" "$INSTDIR\resources\python\get-pip.py" /CANCEL /RESUME /END
  Pop $0
  ${If} $0 != "OK"
    MessageBox MB_ICONSTOP "Failed to download pip: $0"
    Abort
  ${EndIf}

  ; Install pip
  DetailPrint "Installing pip..."
  nsExec::ExecToLog '"$INSTDIR\resources\python\python.exe" "$INSTDIR\resources\python\get-pip.py" --no-warn-script-location'
  Pop $0
  Delete "$INSTDIR\resources\python\get-pip.py"

  ; Install PyTorch with CUDA
  DetailPrint "Downloading PyTorch (this may take several minutes)..."
  nsExec::ExecToLog '"$INSTDIR\resources\python\python.exe" -m pip install torch --index-url https://download.pytorch.org/whl/cu124 --no-warn-script-location --disable-pip-version-check'
  Pop $0

  ; Install openai-whisper
  DetailPrint "Downloading OpenAI Whisper..."
  nsExec::ExecToLog '"$INSTDIR\resources\python\python.exe" -m pip install openai-whisper --no-warn-script-location --disable-pip-version-check'
  Pop $0

  ; --- Download FFmpeg ---
  DetailPrint "Downloading FFmpeg..."
  NScurl::http GET "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" "$INSTDIR\resources\ffmpeg-full.zip" /CANCEL /RESUME /END
  Pop $0
  ${If} $0 != "OK"
    MessageBox MB_ICONSTOP "Failed to download FFmpeg: $0"
    Abort
  ${EndIf}

  ; Extract FFmpeg
  DetailPrint "Extracting FFmpeg..."
  CreateDirectory "$INSTDIR\resources\ffmpeg"
  nsisunz::UnzipToLog "$INSTDIR\resources\ffmpeg-full.zip" "$INSTDIR\resources\ffmpeg-temp"
  Pop $0
  ${If} $0 != "success"
    MessageBox MB_ICONSTOP "Failed to extract FFmpeg: $0"
    Abort
  ${EndIf}

  ; Move ffmpeg.exe to the right place (it's nested in a version folder)
  FindFirst $1 $2 "$INSTDIR\resources\ffmpeg-temp\ffmpeg-*\bin\ffmpeg.exe"
  ${If} $2 != ""
    CopyFiles "$INSTDIR\resources\ffmpeg-temp\ffmpeg-*\bin\ffmpeg.exe" "$INSTDIR\resources\ffmpeg\ffmpeg.exe"
  ${EndIf}
  FindClose $1
  RMDir /r "$INSTDIR\resources\ffmpeg-temp"
  Delete "$INSTDIR\resources\ffmpeg-full.zip"

  DetailPrint "Installation complete."
!macroend

!macro customUnInstall
  RMDir /r "$INSTDIR\resources\python"
  RMDir /r "$INSTDIR\resources\ffmpeg"
!macroend
