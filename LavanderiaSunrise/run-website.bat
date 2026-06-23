@echo off
echo Setting up Laundry Website...

REM Set environment variables — fill these in before running locally
set DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/laundry_shop_db
set NODE_ENV=development
set GMAIL_USER=your_gmail@gmail.com
set GMAIL_PASSWORD=your_gmail_app_password

REM Install dependencies (if needed)
echo Installing dependencies...
npm install

REM Push database schema
echo Setting up database...
npm run db:push

REM Start the server
echo Starting server...
npx tsx server/index.ts

pause
