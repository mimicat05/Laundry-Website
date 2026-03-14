# Laundry Website

A full-stack laundry management website built with React, Express, and PostgreSQL.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database running locally
- Database named `laundry_shop_db` with user `postgres` and password `02091981zen`

## Quick Start

1. **Clone/Download the project**
2. **Make sure PostgreSQL is running** on port 5432
3. **Run the website:**
   ```powershell
   .\run-website.ps1
   ```

   Or manually:
   ```bash
   # Set environment variables
   $env:DATABASE_URL = 'postgresql://postgres:02091981zen@localhost:5432/laundry_shop_db'
   $env:NODE_ENV = 'development'

   # Install dependencies (first time only)
   npm install

   # Setup database
   npm run db:push

   # Start server
   npx tsx server/index.ts
   ```

4. **Open your browser** to `http://localhost:5000`

## What the script does

- Sets required environment variables
- Installs npm dependencies
- Creates/updates database tables
- Starts the development server

## Manual Commands

If you prefer to run commands manually:

```powershell
# Install dependencies
npm install

# Setup database
$env:DATABASE_URL = 'postgresql://postgres:02091981zen@localhost:5432/laundry_shop_db'
npm run db:push

# Start development server
$env:DATABASE_URL = 'postgresql://postgres:02091981zen@localhost:5432/laundry_shop_db'
$env:NODE_ENV = 'development'
npx tsx server/index.ts
```

## Database Setup

The app uses PostgreSQL. Make sure you have:
- PostgreSQL installed and running
- A database named `laundry_shop_db`
- User: `postgres`
- Password: `02091981zen`
- Port: `5432`