Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd backend; npm run dev`"" -Title "Backend Server"

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`"" -Title "Frontend Server"

Write-Host "`nServers are starting up in new windows!" -ForegroundColor Green
Write-Host "Backend is typically on port 5000 or 3000 (check the Backend window for the exact port)."
Write-Host "Frontend is typically on http://localhost:5173 (check the Frontend window for the exact URL)."

Write-Host "`nTo stop the servers, simply close those two new PowerShell windows!" -ForegroundColor Yellow
