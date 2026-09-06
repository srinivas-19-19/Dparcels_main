import nodemailer from 'nodemailer';
import { env } from '../config/env';

// Create a transporter using standard SMTP
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

export const sendOtpEmail = async (to: string, otp: string) => {
  try {
    const mailOptions = {
      from: `"DParcels Support" <${env.SMTP_USER}>`,
      to,
      subject: 'Your DParcels Verification Code',
      text: `Your verification code is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to DParcels!</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 5 minutes. Do not share it with anyone.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] OTP Email sent to ${to} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error('[Mailer] Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};
