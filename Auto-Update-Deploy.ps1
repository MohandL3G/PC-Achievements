Write-Host "--- Checking for Dependency Updates ---" -ForegroundColor Cyan

# 1. Run the update script
.\Update-Dependencies.ps1

# 2. Check if there are any changes to package.json or package-lock.json
$gitStatus = git status --porcelain

if ($gitStatus -match "package.json" -or $gitStatus -match "package-lock.json") {
    Write-Host "`nUpdates were found and applied!" -ForegroundColor Yellow
    
    # 3. Run Build and Push script
    Write-Host "`nRunning Build-And-Push.ps1..." -ForegroundColor Cyan
    .\Build-And-Push.ps1
    
    # Check if build/push succeeded before committing
    if ($LASTEXITCODE -eq 0) {
        # 4. Create a Git commit
        Write-Host "`nCreating Git commit..." -ForegroundColor Cyan
        git add backend/package.json backend/package-lock.json frontend/package.json frontend/package-lock.json
        git commit -m "chore: update dependencies"
        
        Write-Host "`nSuccess! Dependencies updated, Docker image pushed, and changes committed." -ForegroundColor Green
    }
    else {
        Write-Host "`nBuild or push failed. Not committing the changes." -ForegroundColor Red
    }
}
else {
    Write-Host "`nNo dependency updates were found. Everything is already up to date!" -ForegroundColor Green
}
