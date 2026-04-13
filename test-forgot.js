import { createRequire } from 'module';
const require = createRequire(import.meta.url);

require('dotenv').config({ path: ".env.local", override: false });
require('dotenv').config({ path: ".env", override: false });

async function testForgotPassword() {
  try {
    const email = process.env.GMAIL_USER || 'test@example.com';
    console.log('Testing with email:', email);
    const res = await fetch('http://localhost:5001/api/customer/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testForgotPassword();