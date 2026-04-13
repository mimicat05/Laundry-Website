import { createRequire } from 'module';
const require = createRequire(import.meta.url);

require('dotenv').config({ path: ".env.local", override: false });
require('dotenv').config({ path: ".env", override: false });

import { pool } from './server/db.js';

async function checkCustomers() {
  try {
    const res = await pool.query('SELECT email FROM customers LIMIT 5');
    console.log('Customers:', res.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkCustomers();