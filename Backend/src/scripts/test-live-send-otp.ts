import 'dotenv/config';
import fetch from 'node-fetch';

async function testLiveSendOtp() {
  const testEmail = process.argv[2] || 'dparcels6@gmail.com';
  console.log(`Sending live OTP request for email: ${testEmail}...`);

  try {
    const res = await fetch('http://localhost:3000/api/v1/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, purpose: 'EMAIL_VERIFICATION' }),
    });

    const data: any = await res.json();
    console.log('API Response Status:', res.status);
    console.log('API Response Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testLiveSendOtp();
