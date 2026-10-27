@echo off
cd /d "%~dp0pipecat-main" 2>nul && del ".env" 2>nul
echo Old key removed. Run 2-start.bat and paste the new key.
pause
