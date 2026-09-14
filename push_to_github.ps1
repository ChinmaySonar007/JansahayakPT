Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " JanSahayak Prototype: Push to GitHub (JanshayakPT)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Initialize git if not present
if (-not (Test-Path ".git")) {
    Write-Host "[1/4] Initializing Git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
} else {
    Write-Host "[1/4] Git repository already present." -ForegroundColor Green
}

# 2. Stage and commit
Write-Host "[2/4] Staging files..." -ForegroundColor Yellow
git add .

Write-Host "[3/4] Committing code..." -ForegroundColor Yellow
git commit -m "feat: JanSahayak SIH prototype - cooperative dispatch, e-Shram verification, escrow receipts, NCCT training, responsive UI"

# 3. Check GitHub CLI
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
if ($ghInstalled) {
    Write-Host "[4/4] GitHub CLI found. Creating repo and pushing..." -ForegroundColor Yellow
    gh repo create JanshayakPT --public --source=. --remote=origin --push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Repository created and pushed!" -ForegroundColor Green
        exit 0
    }
}

# 4. Fallback manual remote
Write-Host ""
$username = Read-Host "Enter your GitHub username"
if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "No username provided. Exiting." -ForegroundColor Red
    exit 1
}

$remoteUrl = "https://github.com/$username/JanshayakPT.git"
$existingRemote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add origin $remoteUrl
} else {
    git remote set-url origin $remoteUrl
}

Write-Host "Pushing to $remoteUrl..." -ForegroundColor Yellow
git push -u origin main

Write-Host "Done! Your code is live on GitHub." -ForegroundColor Green
