import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateRequest } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { 
  sendOtpSchema, 
  verifyOtpSchema,
  registerSchema, 
  loginSchema, 
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema
} from './auth.schema';
import { 
  sendOtpController,
  verifyOtpController,
  registerController,
  registerRiderController,
  loginController, 
  googleAuthController,
  forgotPasswordController,
  resetPasswordController,
  refreshController, 
  logoutController, 
  getMeController,
  sendWelcomeController
} from './auth.controller';

const router = Router();

// Rate Limiter for Auth endpoints
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Public Routes
router.post('/send-otp', authLimiter, validateRequest(sendOtpSchema), sendOtpController);
router.post('/verify-otp', authLimiter, validateRequest(verifyOtpSchema), verifyOtpController);
router.post('/register/customer', authLimiter, validateRequest(registerSchema), registerController);
router.post('/register/rider', authLimiter, registerRiderController);
router.post('/send-welcome', authLimiter, sendWelcomeController);
router.post('/login', authLimiter, validateRequest(loginSchema), loginController);
router.post('/google', authLimiter, validateRequest(googleAuthSchema), googleAuthController);
router.post('/forgot-password', authLimiter, validateRequest(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', authLimiter, validateRequest(resetPasswordSchema), resetPasswordController);
router.post('/refresh', validateRequest(refreshSchema), refreshController);

// Protected routes
router.post('/logout', authenticate, logoutController);
router.get('/me', authenticate, getMeController);

export default router;
