# --- Configuration ---
$WebhookUrl = "https://your-n8n-webhook-url-here"
$ProjectName = "PC-Achievements"

function Invoke-UpdateTask($folderName) {
    Write-Host "`n--- Updating $folderName ---" -ForegroundColor Cyan
    
    # Save current location and enter folder
    Push-Location $folderName
    
    Write-Host "Running npm update..."
    $updateResult = npm update 2>&1 | Out-String
    
    Write-Host "Running npm audit fix..."
    $auditResult = npm audit fix 2>&1 | Out-String
    
    # Return to root
    Pop-Location
    
    return @{
        folder = $folderName
        update = $updateResult.Trim()
        audit  = $auditResult.Trim()
    }
}

# 1. Run updates for both parts
$backend = Invoke-UpdateTask "backend"
$frontend = Invoke-UpdateTask "frontend"

# 2. Prepare the data for n8n
$payload = @{
    project   = $ProjectName
    status    = "Success"
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    details   = @($backend, $frontend)
} | ConvertTo-Json -Depth 5

# 3. Send to Webhook
if ($WebhookUrl -like "*your-n8n-webhook*") {
    Write-Host "`n[!] Webhook URL not set. Results will only be printed to console." -ForegroundColor Yellow
    Write-Host $payload
}
else {
    Write-Host "`nSending results to n8n..." -ForegroundColor Cyan
    try {
        Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $payload -ContentType "application/json"
        Write-Host "Successfully sent to n8n!" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to send to webhook: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nUpdate process complete!" -ForegroundColor Green
