@echo off
chcp 65001 >nul
echo ========================================================
echo    Syncing & Pushing Masco Export ERP to GitHub
echo    Repository: https://github.com/fayzarcomputer/masco-ind-ltd.git
echo ========================================================
echo.

:: 1. Initialize Git if not already initialized
if not exist ".git" (
    echo [1/5] Initializing local git repository...
    git init
)

:: 2. Configure Git Identity
echo [2/5] Configuring Git user identity...
git config user.name "fayzarcomputer"
git config user.email "fayzarcomputer@gmail.com"

:: 3. Stage all files
echo [3/5] Staging files...
git add .

:: 4. Commit changes
echo [4/5] Committing changes...
git commit -m "Configure GitHub Pages live hosting, workflow and root redirect"

:: 5. Set branch and push
echo [5/5] Pushing updates to GitHub...
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/fayzarcomputer/masco-ind-ltd.git
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  SUCCESS: All updates pushed to GitHub!
    echo ========================================================
) else (
    echo ========================================================
    echo  Push finished with message above.
    echo ========================================================
)

pause
