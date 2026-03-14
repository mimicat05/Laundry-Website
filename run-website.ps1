# Laundry Website Runner Script
Write-Host "Setting up Laundry Website..." -ForegroundColor Green

# Set environment variables
$env:DATABASE_URL = 'postgresql://postgres:02091981zen@localhost:5432/laundry_shop_db'
$env:NODE_ENV = 'development'
$env:GMAIL_USER = 'zeninmaejalique05@gmail.com'
$env:GMAIL_PASSWORD = 'ncjdrcglunldzptc'

# Pick an available port so the script can run even if 5000 is already in use
function Get-FreePort {
    param(
        [int]$StartPort = 5000,
        [int]$EndPort = 5010
    )

    for ($p = $StartPort; $p -le $EndPort; $p++) {
        $inUse = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        if (-not $inUse) {
            return $p
        }
    }

    throw "No free port found between $StartPort and $EndPort."
}

$freePort = Get-FreePort
$env:PORT = $freePort

# Check if dependencies are installed
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Push database schema
Write-Host "Setting up database..." -ForegroundColor Yellow
npm run db:push

# Start the server
Write-Host "Starting server on http://localhost:$freePort..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
npx tsx server/index.ts