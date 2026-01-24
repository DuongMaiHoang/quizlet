# Script to set HOME environment variable for Windows
# This is needed for Playwright and browser tools on Windows

if (-not $env:HOME) {
    $env:HOME = $env:USERPROFILE
    Write-Host "✅ Set HOME to: $env:HOME" -ForegroundColor Green
} else {
    Write-Host "✅ HOME is already set to: $env:HOME" -ForegroundColor Green
}

