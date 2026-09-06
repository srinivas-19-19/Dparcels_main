export type OtpPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE';

export interface OtpRecord {
  hashedOtp: string;
  purpose: OtpPurpose;
  attempts: number;
  createdAt: number;
  email: string;
}

export interface SendOtpParams {
  email: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpParams {
  email: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface SendOtpResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
}
