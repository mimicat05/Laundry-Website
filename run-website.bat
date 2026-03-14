@echo off
echo Setting up Laundry Website...

REM Set environment variables
set DATABASE_URL=postgresql://postgres:02091981zen@localhost:5432/laundry_shop_db
set NODE_ENV=development

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