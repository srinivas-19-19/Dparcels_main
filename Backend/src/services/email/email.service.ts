import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../../config/env';
import { getOtpEmailTemplate, getWelcomeEmailTemplate, OtpTemplatePurpose } from './email.templates';

class EmailService {
  private transporter: Transporter;

  constructor() {
    const smtpPassword = env.SMTP_PASSWORD || process.env.SMTP_PASS || '';
    
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(env.SMTP_PORT) || 587,
      secure: env.SMTP_SECURE || false, // false for 587 (STARTTLS)
      auth: {
        user: env.SMTP_USER,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert errors in local dev
      },
    });
  }

  /**
   * Safely verify SMTP connection during server startup.
   * Does NOT leak credentials in logs.
   */
  public async verifySmtpTransporter(): Promise<boolean> {
    if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
      console.log('SMTP transporter initialized (credentials pending in .env).');
      return false;
    }
    try {
      await this.transporter.verify();
      console.log('SMTP transporter configured successfully.');
      return true;
    } catch (error: any) {
      // Safe logging without credentials
      console.error('[SMTP Error] Failed to connect to SMTP server:', error.message || 'Unknown SMTP error');
      return false;
    }
  }

  /**
   * Sends OTP email using Nodemailer & Gmail SMTP.
   * Masks internal SMTP errors for API callers.
   */
  public async sendOtpEmail(to: string, otp: string, purpose: OtpTemplatePurpose): Promise<boolean> {
    // If running in test environment or sending to mock domain, simulate email sending cleanly
    if (process.env.NODE_ENV === 'test' || to.endsWith('@example.com') || to.endsWith('@test.com')) {
      console.log(`[EmailService] Simulated ${purpose} OTP email send to ${to}`);
      return true;
    }

    const fromName = env.SMTP_FROM_NAME || 'DParcels';
    const fromEmail = env.SMTP_FROM_EMAIL || env.SMTP_USER || 'no-reply@dparcels.com';
    const template = getOtpEmailTemplate(otp, purpose);

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Sent ${purpose} email to ${to} (MessageID: ${info.messageId})`);
      return true;
    } catch (error: any) {
      // Technical log server-side (no passwords/secrets printed)
      console.error(`[EmailService Error] Failed to send email to ${to}:`, error?.message || error);
      
      // Mask internal SMTP errors
      throw new Error('Unable to send verification email. Please try again later.');
    }
  }

  /**
   * Sends Welcome to DParcels email after registration & email verification.
   */
  public async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'test' || to.endsWith('@example.com') || to.endsWith('@test.com')) {
      console.log(`[EmailService] Simulated Welcome email send to ${to}`);
      return true;
    }

    const fromName = env.SMTP_FROM_NAME || 'DParcels';
    const fromEmail = env.SMTP_FROM_EMAIL || env.SMTP_USER || 'no-reply@dparcels.com';
    const template = getWelcomeEmailTemplate(name);

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Sent Welcome email to ${to} (MessageID: ${info.messageId})`);
      return true;
    } catch (error: any) {
      console.error(`[EmailService Error] Failed to send Welcome email to ${to}:`, error?.message || error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
