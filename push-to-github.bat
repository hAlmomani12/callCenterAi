@echo off
setlocal
cd /d "%~dp0"
title Push to GitHub

where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed. Download it from https://git-scm.com/download/win then run this again.
  pause
  exit /b 1
)

if not exist ".git" git init
git branch -M main

git add -A

rem --- safety check: never upload the API key or the engine folder ---
git diff --cached --name-only | findstr /i /r "\.env pipecat-main/" >nul
if not errorlevel 1 (
  echo STOP: a secret or the engine folder was about to be uploaded. Nothing was pushed.
  git reset >nul
  pause
  exit /b 1
)

git config user.email >nul 2>nul
if errorlevel 1 (
  set /p "GEMAIL=Your GitHub email (for the commit author): "
  call git config user.email "%%GEMAIL%%"
  git config user.name "hAlmomani12"
)
set "MSG=first commit"
git rev-parse --verify HEAD >nul 2>nul && set "MSG=Update project"
git commit -m "%MSG%" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_014pWHpLH3p8VdvDc4HngxN8" || echo (nothing new to commit)

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin https://github.com/hAlmomani12/callCenterAi.git
) else (
  git remote set-url origin https://github.com/hAlmomani12/callCenterAi.git
)

echo.
echo Pushing... a GitHub sign-in window may appear the first time.
git push -u origin main
if errorlevel 1 (
  echo.
  echo Push failed. If it says "rejected", the repo already has commits online:
  echo   run:  git pull origin main --allow-unrelated-histories   then run this file again.
) else (
  echo.
  echo DONE! Open https://github.com/hAlmomani12/callCenterAi
)
pause
