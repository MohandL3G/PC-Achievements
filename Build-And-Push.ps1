$ImageName = "mohandl3g/pc-achievements"
$Tag = "latest"
$FullImage = "$ImageName:$Tag"

Write-Host "`n[1/4] Building Docker Image: $FullImage..." -ForegroundColor Cyan
docker build -t $FullImage .

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError: Build failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n[2/4] Pushing Docker Image: $FullImage..." -ForegroundColor Cyan
docker push $FullImage

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError: Push failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n[3/4] Cleaning up Docker build history..." -ForegroundColor Cyan
# Removes build records (the list in Docker Desktop "Builds" tab)
docker buildx history rm --all

Write-Host "`n[4/4] Pruning builder cache..." -ForegroundColor Cyan
# Removes the actual build cache layers
docker builder prune -a -f

Write-Host "`nSuccessfully finished building, pushing, and cleaning up!" -ForegroundColor Green
