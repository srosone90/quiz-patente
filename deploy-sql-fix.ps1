# AUTOMATE SQL FIX DEPLOYMENT
# This script copies SQL to clipboard and opens Supabase SQL Editor

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "AUTOMATED SQL DEPLOYMENT" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Read SQL file
$sqlFile = Join-Path $PSScriptRoot "MASTER-FIX-COMPLETE.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: MASTER-FIX-COMPLETE.sql not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Reading SQL file..." -ForegroundColor Yellow
$sqlContent = Get-Content $sqlFile -Raw

# Copy to clipboard
Write-Host "Copying SQL to clipboard..." -ForegroundColor Yellow
Set-Clipboard -Value $sqlContent

Write-Host "SQL copied to clipboard!" -ForegroundColor Green
Write-Host ""

# Open Supabase SQL Editor
$supabaseUrl = "https://supabase.com/dashboard/project/dsxzqwicsggzyeropget/sql/new"
Write-Host "Opening Supabase SQL Editor..." -ForegroundColor Yellow
Start-Process $supabaseUrl

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "READY TO DEPLOY!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. SQL is in your clipboard" -ForegroundColor White
Write-Host "2. SQL Editor is opening in browser" -ForegroundColor White
Write-Host "3. Press Ctrl+V to paste" -ForegroundColor White
Write-Host "4. Click RUN button" -ForegroundColor White
Write-Host "5. Wait for success messages" -ForegroundColor White
Write-Host "6. Refresh admin dashboard" -ForegroundColor White
Write-Host ""
