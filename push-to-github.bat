@echo off
chcp 65001 >nul
echo ========================================================
echo    Pushing Masco Export Invoicing Project to GitHub
echo    Repository: https://github.com/fayzarcomputer/masco-ind-ltd.git
echo ========================================================
echo.

:: 1. Initialize Git if not already initialized
if not exist ".git" (
    echo [1/6] Initializing local git repository...
    git init
) else (
    echo [1/6] Local Git repository found.
)

:: 2. Configure Git Identity (Fixes "unable to auto-detect email address")
echo [2/6] Configuring Git user identity...
git config user.name "fayzarcomputer"
git config user.email "fayzarcomputer@gmail.com"

:: 3. Stage all project files
echo [3/6] Adding all files to staging...
git add .

:: 4. Commit
echo [4/6] Committing files...
git commit -m "Initial commit: Masco Industries Commercial Export Invoicing System"

:: 5. Set Main Branch
echo [5/6] Setting branch to main...
git branch -M main

:: 6. Setup Remote Origin & Push
echo [6/6] Connecting to GitHub remote and pushing...
git remote remove origin 2>nul
git remote add origin https://github.com/fayzarcomputer/masco-ind-ltd.git

echo.
echo ========================================================
echo Uploading files to GitHub... Please wait...
echo ========================================================
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  SUCCESS: All files pushed to GitHub successfully!
    echo  Visit: https://github.com/fayzarcomputer/masco-ind-ltd
    echo ========================================================
) else (
    echo ========================================================
    echo  If browser asks to login, please sign in to complete push.
    echo ========================================================
)

pause
