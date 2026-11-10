import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  changePassword,
  forgotPassword,
  resendVerification,
  resetPassword,
  signIn,
  signUp,
  verifyEmail
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const authRoutes = Router();
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_OTP_REQUESTS', message: 'Too many code requests. Please try again later.' } }
});

authRoutes.post('/signup', otpRateLimit, signUp);
authRoutes.post('/signin', signIn);
authRoutes.post('/verify-email', otpRateLimit, verifyEmail);
authRoutes.post('/resend-verification', otpRateLimit, resendVerification);
authRoutes.post('/forgot-password', otpRateLimit, forgotPassword);
authRoutes.post('/reset-password', otpRateLimit, resetPassword);
authRoutes.post('/change-password', authenticate, changePassword);
