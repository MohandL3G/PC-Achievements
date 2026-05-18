function Invoke-UpdateTask($folderName) {
    Write-Host "`n--- Updating $folderName ---" -ForegroundColor Cyan
    
    # Save current location and enter folder
    Push-Location $folderName
    
    Write-Host "Running npm update..."
    npm update
    
    Write-Host "Running npm audit fix..."
    npm audit fix
    
    # Return to root
    Pop-Location
}

# Run updates for both parts
Invoke-UpdateTask "backend"
Invoke-UpdateTask "frontend"

Write-Host "`nUpdate process complete!" -ForegroundColor Green
