Write-Host "Starting Lavanderia Sunrise..." -ForegroundColor Green

# Check .env.local exists
if (!(Test-Path ".env.local")) {
    Write-Host ""
    Write-Host "ERROR: .env.local not found." -ForegroundColor Red
    Write-Host "Copy .env.example to .env.local and fill in your database credentials." -ForegroundColor Yellow
    Write-Host "  copy .env.example .env.local" -ForegroundColor Cyan
    exit 1
}

# Install dependencies if missing
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Push database schema
Write-Host "Setting up database..." -ForegroundColor Yellow
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Database setup failed. Check your DATABASE_URL in .env.local." -ForegroundColor Red
    exit 1
}

# Start the server (reads .env.local automatically)
Write-Host ""
Write-Host "Server starting at http://localhost:5000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host ""
npm run dev
