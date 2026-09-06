import 'dotenv/config';
import emailService from '../services/email/email.service';

async function testSmtp() {
  console.log('Testing SMTP connection...');
  const success = await emailService.verifySmtpTransporter();
  if (success) {
    console.log('✅ SMTP verification succeeded! Nodemailer can connect to Gmail.');
  } else {
    console.log('❌ SMTP verification failed.');
  }
}

testSmtp();
