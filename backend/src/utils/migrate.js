const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the backend .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Reference the database URL for migration tools or scripts
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

console.log(`Running migrations using ${databaseUrl}`);
// TODO: Add migration logic here

