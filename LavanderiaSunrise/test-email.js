import { sendOrderStatusEmail } from './server/email.js';

async function testEmail() {
  try {
    await sendOrderStatusEmail('test@example.com', 'Test User', 'ORD001', 'pending');
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email failed:', error);
  }
}

testEmail();