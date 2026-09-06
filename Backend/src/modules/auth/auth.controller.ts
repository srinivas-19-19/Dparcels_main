import { Request, Response } from 'express';
import { AuthServices } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { CustomError } from '../../services/otp/otp.service';
import emailService from '../../services/email/email.service';

export const sendOtpController = async (req: Request, res: Response) => {
  try {
    const { email, purpose = 'EMAIL_VERIFICATION' } = req.body;

    if (purpose === 'EMAIL_VERIFICATION') {
      try {
        const existingUser = await AuthServices.findUserByEmailOrPhone(email);
        if (existingUser) {
          return sendError(res, 400, 'Email already registered. Please login instead.');
        }
      } catch (dbErr: any) {
        console.warn('[sendOtpController] DB user check notice:', dbErr?.message || dbErr);
      }
    }

    await AuthServices.sendOtp(email, purpose);
    return sendSuccess(res, 200, null, 'OTP sent successfully to your email.');
  } catch (error: any) {
    const status = error instanceof CustomError ? error.statusCode : 400;
    return sendError(res, status, error.message || 'Error sending OTP');
  }
};

export const verifyOtpController = async (req: Request, res: Response) => {
  try {
    const { email, otp, purpose = 'EMAIL_VERIFICATION' } = req.body;
    await AuthServices.verifyOtp(email, otp, purpose);
    return sendSuccess(res, 200, null, 'OTP verified successfully');
  } catch (error: any) {
    const status = error instanceof CustomError ? error.statusCode : 400;
    return sendError(res, status, error.message || 'Error verifying OTP');
  }
};

export const registerController = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const role = data.role || 'CUSTOMER';
    if (role !== 'CUSTOMER') {
      return sendError(res, 400, 'Only Customer registration is supported on this endpoint');
    }
    data.role = role;
    
    const result = await AuthServices.registerCustomer(data);
    return sendSuccess(res, 201, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, 'Registration successful. Please login.');
  } catch (error: any) {
    const status = error instanceof CustomError ? error.statusCode : 400;
    const rawMsg = error?.message || 'Error during registration';
    const message = (typeof rawMsg === 'string' && (rawMsg.includes('prisma') || rawMsg.includes('Invocation') || rawMsg.includes('credentials')))
      ? 'Invalid OTP. Please try again.'
      : rawMsg;
    return sendError(res, status, message);
  }
};

export const registerRiderController = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const result = await AuthServices.registerRider(data);
    return sendSuccess(res, 201, {
      user: { id: result.user.id, email: result.user.email, role: result.user.role },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, 'Rider registered successfully and pending approval');
  } catch (error: any) {
    const status = error instanceof CustomError ? error.statusCode : 400;
    return sendError(res, status, error.message || 'Error during rider registration');
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const result = await AuthServices.login(req.body);
    return sendSuccess(res, 200, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, 'Login successful');
  } catch (error: any) {
    const status = error instanceof CustomError ? error.statusCode : 401;
    const message = error instanceof CustomError ? error.message : 'Invalid email or password.';
    return sendError(res, status, message);
  }
};

export const googleAuthController = async (req: Request, res: Response) => {
  try {
    const result = await AuthServices.loginGoogle(req.body);
    return sendSuccess(res, 200, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, 'Google authentication successful');
  } catch (error: any) {
    const status = error instanceof CustomError ? error.statusCode : 401;
    return sendError(res, status, error.message || 'Google sign-in was cancelled or failed.');
  }
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    await AuthServices.forgotPassword(req.body);
    return sendSuccess(res, 200, null, 'Reset OTP sent successfully');
  } catch (error: any) {
    const status = error instanceof CustomError ? error.statusCode : 400;
    return sendError(res, status, error.message || 'Error sending reset OTP');
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    await AuthServices.resetPassword(req.body);
    return sendSuccess(res, 200, null, 'Password reset successfully');
  } catch (error: any) {
    const status = error instanceof CustomError ? error.statusCode : 400;
    const message = error instanceof CustomError ? error.message : 'Unable to reset password. Please try again.';
    return sendError(res, status, message);
  }
};

export const refreshController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthServices.refreshSession(refreshToken);
    return sendSuccess(res, 200, result, 'Tokens refreshed');
  } catch (error: any) {
    const status = error instanceof CustomError ? error.statusCode : 401;
    return sendError(res, status, error.message || 'Error refreshing tokens');
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { refreshToken } = req.body;
    
    if (!userId) {
      return sendError(res, 401, 'Unauthorized');
    }
    
    await AuthServices.logout(userId, refreshToken);
    return sendSuccess(res, 200, null, 'Logged out successfully');
  } catch (error: any) {
    return sendError(res, 500, 'Error logging out');
  }
};

export const getMeController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, 'Unauthorized');
    }
    const user = await AuthServices.getMe(userId);
    return sendSuccess(res, 200, user);
  } catch (error: any) {
    return sendError(res, 500, 'Error fetching profile');
  }
};

export const sendWelcomeController = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return sendError(res, 400, 'Email is required');
    }
    await emailService.sendWelcomeEmail(email, name || 'Customer');
    return sendSuccess(res, 200, null, 'Welcome email sent successfully');
  } catch (error: any) {
    console.error('[sendWelcomeController] Error sending welcome email:', error);
    return sendError(res, 500, 'Failed to send welcome email');
  }
};
