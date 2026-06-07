# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for whisper-worker."""

a = Analysis(
    ['whisper_worker.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['whisper', 'torch', 'numpy', 'tqdm', 'regex', 'tiktoken', 'tiktoken_ext'],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='whisper-worker',
    debug=False,
    strip=False,
    upx=False,
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name='whisper-worker',
)
