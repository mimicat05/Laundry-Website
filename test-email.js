import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

import { sendOrderStatusEmail } from './server/email.ts';

async function testEmail() {
  try {
    await sendOrderStatusEmail('test@example.com', 'Test User', 'ORD001', 'pending');
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email failed:', error);
  }
}

testEmail();