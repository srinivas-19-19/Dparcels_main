export type OtpTemplatePurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE';

export interface EmailTemplateContent {
  subject: string;
  text: string;
  html: string;
}

export function getOtpEmailTemplate(otp: string, purpose: OtpTemplatePurpose): EmailTemplateContent {
  let title = 'Verification Code';
  let subject = 'DParcels Email Verification OTP';
  let actionText = 'verify your email address';

  if (purpose === 'PASSWORD_RESET') {
    title = 'Password Reset Code';
    subject = 'DParcels Password Reset OTP';
    actionText = 'reset your account password';
  } else if (purpose === 'EMAIL_CHANGE') {
    title = 'Email Change Code';
    subject = 'DParcels Email Change OTP';
    actionText = 'update your email address';
  }

  const text = `Hello,\n\nYour DParcels verification code is:\n\n${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this code, please ignore this email.\n\nRegards,\nDParcels Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 500px; background-color: #151c2c; border-radius: 16px; border: 1px solid rgba(255, 107, 0, 0.25); box-shadow: 0 20px 40px rgba(0,0,0,0.5); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ff6b00; font-style: italic;">
                DPARCELS
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">
                Logistics & Fast Delivery
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center;">
                ${title}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #94a3b8; line-height: 1.6; text-align: center;">
                Hello,<br>
                Use the verification code below to ${actionText}.
              </p>
              
              <!-- OTP Box -->
              <div style="background: rgba(255, 107, 0, 0.08); border: 2px dashed #ff6b00; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #ff6b00; display: inline-block;">
                  ${otp}
                </span>
              </div>
              
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #cbd5e1; text-align: center; font-weight: 600;">
                ⏱️ This code expires in <strong style="color: #ff6b00;">5 minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
                If you did not request this code, please ignore this email or contact support if you have security concerns.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #0d1320; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Regards,<br>
                <strong style="color: #94a3b8;">DParcels Team</strong>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #475569;">
                © 2026 DParcels India Pvt Ltd. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, text, html };
}

export function getWelcomeEmailTemplate(name: string): EmailTemplateContent {
  const subject = 'Welcome to DeParcels! 🎉';
  const text = `Welcome to DeParcels!\n\nYour account has been successfully created and your email has been verified.\n\nWe're happy to have you with us. You can now log in and start using DeParcels.\n\nThank you for joining DeParcels!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 500px; background-color: #151c2c; border-radius: 16px; border: 1px solid rgba(34, 197, 94, 0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.5); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ff6b00; font-style: italic;">
                DEPARCELS
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #22c55e; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">
                ✓ Account Created & Verified
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(34, 197, 94, 0.15); border: 2px solid #22c55e; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 28px; color: #22c55e;">✓</span>
              </div>
              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                Welcome to DeParcels! 🎉
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Your account has been successfully created and your email has been verified.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
                We're happy to have you with us. You can now log in and start using DeParcels.
              </p>
              
              <div style="background: rgba(255, 107, 0, 0.08); border: 1px solid rgba(255, 107, 0, 0.25); border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 13px; font-weight: 700; color: #ff6b00;">
                  Thank you for joining DeParcels!
                </span>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #0d1320; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Regards,<br>
                <strong style="color: #94a3b8;">DeParcels Team</strong>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #475569;">
                © 2026 DeParcels India Pvt Ltd. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, text, html };
}

