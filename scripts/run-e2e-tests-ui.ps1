# Script to run e2e tests in UI mode with HOME environment variable set

# Set HOME if not already set
if (-not $env:HOME) {
    $env:HOME = $env:USERPROFILE
    Write-Host "✅ Set HOME to: $env:HOME" -ForegroundColor Green
}

# Run Playwright tests in UI mode
Write-Host "🚀 Running Playwright tests in UI mode..." -ForegroundColor Cyan
npx playwright test --ui

