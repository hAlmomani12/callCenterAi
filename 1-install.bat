@echo off
setlocal
title Pipecat Demo - Install
cd /d "%~dp0"
set "PATH=%USERPROFILE%\.local\bin;%PATH%"
set SETUPTOOLS_SCM_PRETEND_VERSION=1.0.0

echo ==================================================
echo   Pipecat Demo - Installation
echo ==================================================
echo.

echo [1/3] Checking uv (Python package manager)...
where uv >nul 2>nul
if errorlevel 1 (
  echo       Installing uv...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"
)
where uv >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERROR: uv could not be installed. Check your internet connection and try again.
  pause
  exit /b 1
)
echo       OK
echo.

echo [2/3] Downloading Pipecat from GitHub...
if exist "pipecat-main\pyproject.toml" (
  echo       Already downloaded - skipping.
) else (
  powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest 'https://github.com/pipecat-ai/pipecat/archive/refs/heads/main.zip' -OutFile 'pipecat.zip'; Expand-Archive 'pipecat.zip' -DestinationPath '.' -Force; Remove-Item 'pipecat.zip'"
)
if not exist "pipecat-main\pyproject.toml" (
  echo.
  echo ERROR: Download failed. Move this folder to a short path like C:\Pipecat-Demo and try again.
  pause
  exit /b 1
)
echo       OK
echo.

echo [3/3] Installing Python + libraries (takes a few minutes the first time)...
cd /d "%~dp0pipecat-main"
uv sync --extra openai --extra webrtc --extra runner --extra silero --extra websocket --extra daily --extra livekit
if errorlevel 1 (
  echo.
  echo ERROR: Library installation failed. Take a screenshot of the messages above.
  pause
  exit /b 1
)

echo.
echo ==================================================
echo   DONE! Now double-click 2-start.bat
echo ==================================================
pause
