# Script to run e2e tests with HOME environment variable set
# This fixes the "$HOME environment variable is not set" issue on Windows

# Set HOME if not already set
if (-not $env:HOME) {
    $env:HOME = $env:USERPROFILE
    Write-Host "✅ Set HOME to: $env:HOME" -ForegroundColor Green
}

# Get the test command (default or passed as argument)
$testCommand = if ($args.Count -gt 0) { $args[0] } else { "test" }
$uiMode = if ($args -contains "--ui") { "--ui" } else { "" }

# Run Playwright tests
Write-Host "🚀 Running Playwright tests..." -ForegroundColor Cyan
npx playwright test $testCommand $uiMode

