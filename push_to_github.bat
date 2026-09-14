@echo off
echo ========================================================
echo  JanSahayak Prototype: Push to GitHub (JanshayakPT)
echo ========================================================
echo.

REM 1. Verify Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not found in PATH.
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

REM 2. Initialize repo if needed
if not exist .git (
    echo [1/4] Initializing local Git repository...
    git init
    git branch -M main
) else (
    echo [1/4] Local Git repository detected.
)

REM 3. Stage and commit files
echo [2/4] Staging files...
git add .

echo [3/4] Committing changes...
git commit -m "feat: JanSahayak SIH prototype - cooperative dispatch, e-Shram verification, escrow receipts, NCCT training, responsive UI"

REM 4. Check if GitHub CLI (gh) is available to auto-create the repo
where gh >nul 2>nul
if %errorlevel% equ 0 (
    echo.
    echo GitHub CLI (gh) detected. Attempting automatic repo creation...
    gh repo create JanshayakPT --public --source=. --remote=origin --push
    if %errorlevel% equ 0 (
        echo.
        echo ========================================================
        echo  SUCCESS: Pushed to GitHub repository 'JanshayakPT'!
        echo ========================================================
        pause
        exit /b 0
    )
)

REM 5. Fallback: Prompt user for their GitHub username
echo.
echo If you haven't created the repository on GitHub yet:
echo 1. Open https://github.com/new in your browser
echo 2. Repository name: JanshayakPT
echo 3. Keep 'Add a README' UNCHECKED
echo 4. Click 'Create repository'
echo.
set /p GITHUB_USERNAME="Enter your GitHub username (e.g. your-name): "

if "%GITHUB_USERNAME%"=="" (
    echo No username entered. Aborting.
    pause
    exit /b 1
)

git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    git remote add origin https://github.com/%GITHUB_USERNAME%/JanshayakPT.git
) else (
    git remote set-url origin https://github.com/%GITHUB_USERNAME%/JanshayakPT.git
)

echo.
echo Pushing branch 'main' to https://github.com/%GITHUB_USERNAME%/JanshayakPT.git ...
git push -u origin main

echo.
echo ========================================================
echo  All done! Visit: https://github.com/%GITHUB_USERNAME%/JanshayakPT
echo ========================================================
pause
