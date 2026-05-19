Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell "-NoExit -Command cd backend; npm run dev"

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell "-NoExit -Command cd frontend; npm run dev"

Write-Host "`nServers are starting up in new windows!" -ForegroundColor Green
Write-Host "Backend is on http://localhost:5000"
Write-Host "Frontend is on http://localhost:5173"

Write-Host "`nTo stop the servers, close the two PowerShell windows." -ForegroundColor Yellow
