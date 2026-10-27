@echo off
setlocal
title Manaseer Voice Bot
cd /d "%~dp0"
set "PATH=%USERPROFILE%\.local\bin;%PATH%"
set SETUPTOOLS_SCM_PRETEND_VERSION=1.0.0

if not exist "%~dp0pipecat-main\.venv" (
  echo First time? Run 1-install.bat first.
  pause
  exit /b 1
)

rem --- close any old bot that is still running on port 7860 ---
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":7860" ^| findstr "LISTENING"') do (
  echo Closing old bot window ^(PID %%p^)...
  taskkill /PID %%p /F >nul 2>&1
)

rem --- copy the latest app files into the engine ---
copy /Y "%~dp0app\manaseer-bot.py" "%~dp0pipecat-main\examples\realtime\manaseer-bot.py" >nul
copy /Y "%~dp0app\ui.html" "%~dp0pipecat-main\examples\realtime\ui.html" >nul
copy /Y "%~dp0knowledge_base.md" "%~dp0pipecat-main\examples\realtime\knowledge_base.md" >nul

cd /d "%~dp0pipecat-main"
if not exist ".env" (
  echo.
  set /p "KEY=Paste your OpenAI API key (starts with sk-) and press Enter: "
  call >".env" echo OPENAI_API_KEY=%%KEY%%
)

echo.
echo Choose a voice (auto-selects 1 in 5 seconds):
echo   1. cedar  - male, natural
echo   2. marin  - female, natural
echo   3. ash    - male, deeper
echo   4. coral  - female, cheerful
choice /c 1234 /n /t 5 /d 1 /m "Press 1-4: "
set "BOT_VOICE=cedar"
if errorlevel 2 set "BOT_VOICE=marin"
if errorlevel 3 set "BOT_VOICE=ash"
if errorlevel 4 set "BOT_VOICE=coral"
echo Voice: %BOT_VOICE%

echo.
echo Starting... the browser will open by itself in a few seconds.
echo Keep this window open during the call. Close it to stop the bot.
echo.
start "" cmd /c "timeout /t 15 /nobreak >nul & start http://localhost:7860/client/?v=%RANDOM%%RANDOM%"
uv run python examples\realtime\manaseer-bot.py
echo.
echo The bot stopped. If you see an error above, take a screenshot.
pause
