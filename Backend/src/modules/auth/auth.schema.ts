import { z } from 'zod';

export const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    purpose: z
      .enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_CHANGE'])
      .optional()
      .default('EMAIL_VERIFICATION'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    purpose: z
      .enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_CHANGE'])
      .optional()
      .default('EMAIL_VERIFICATION'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional().default(''),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    phone: z.string().optional(),
    role: z.enum(['CUSTOMER', 'RIDER']).optional().default('CUSTOMER'),
    fcmToken: z.string().optional(),
    
    // Rider specific fields (Optional, only required if role is RIDER)
    vehicleType: z.string().optional(),
    vehicleNumber: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Email or phone is required'),
    password: z.string().min(1, 'Password is required'),
    fcmToken: z.string().optional(),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const loginOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token is required'),
    fcmToken: z.string().optional(),
  }),
});
