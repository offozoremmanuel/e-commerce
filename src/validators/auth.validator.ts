import { z } from 'zod';

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string()
  .min(12, 'Password must be at least 12 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 bytes');
const loginPassword = z.string()
  .min(1, 'Password is required')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 bytes');

export const signUpSchema = z.object({
  email,
  password,
  fullName: z.string().trim().min(2).max(100)
}).strict();

export const signInSchema = z.object({ email, password: loginPassword }).strict();
const otp = z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code');

export const verifyEmailSchema = z.object({ email, otp }).strict();
export const resendVerificationSchema = z.object({ email }).strict();
export const forgotPasswordSchema = z.object({ email }).strict();
export const resetPasswordSchema = z.object({ email, otp, password }).strict();
export const changePasswordSchema = z.object({
  currentPassword: loginPassword,
  newPassword: password
}).strict();

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
