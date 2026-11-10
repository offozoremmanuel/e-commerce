import type { RequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { EmailOtpPurpose } from '../generated/prisma/enums.js';
import { prisma } from '../config/database.js';
import { AuthError, createSession } from '../services/auth.service.js';
import { consumeEmailOtp, issueEmailOtp } from '../services/emailOtp.service.js';
import { HttpError } from '../utils/httpError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  verifyEmailSchema
} from '../validators/auth.validator.js';

export const signUp: RequestHandler = async (req, res) => {
  const input = signUpSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true }
  });

  if (existingUser) {
    throw new AuthError('This email is already registered. Please sign in or use another email address.', 409, 'EMAIL_IN_USE');
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: { email: input.email, fullName: input.fullName, passwordHash },
      select: { id: true, email: true, fullName: true }
    });
    await issueEmailOtp(user, EmailOtpPurpose.SIGNUP);
    sendSuccess(res, 201, { message: 'We sent a verification code to your email address.' });
  } catch (error) {
    // Keep the database constraint as a safeguard if two signups race after the lookup.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AuthError('This email is already registered. Please sign in or use another email address.', 409, 'EMAIL_IN_USE');
    }
    throw error;
  }
};

export const verifyEmail: RequestHandler = async (req, res) => {
  const input = verifyEmailSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, fullName: true, role: true, emailVerifiedAt: true }
  });
  if (!user || user.emailVerifiedAt) {
    throw new HttpError('The code is invalid or has expired.', 400, 'INVALID_OR_EXPIRED_OTP');
  }

  const verified = await prisma.$transaction(async (tx) => {
    const consumed = await consumeEmailOtp(tx, user.id, EmailOtpPurpose.SIGNUP, input.otp);
    if (!consumed) return false;
    await tx.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    return true;
  });
  if (!verified) throw new HttpError('The code is invalid or has expired.', 400, 'INVALID_OR_EXPIRED_OTP');

  const { emailVerifiedAt: _emailVerifiedAt, ...publicUser } = user;
  sendSuccess(res, 200, createSession(publicUser));
};

export const resendVerification: RequestHandler = async (req, res) => {
  const input = resendVerificationSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, fullName: true, emailVerifiedAt: true }
  });
  if (user && !user.emailVerifiedAt) {
    await issueEmailOtp(user, EmailOtpPurpose.SIGNUP);
  }
  sendSuccess(res, 200, { message: 'If the account needs verification, a code has been sent to its email address.' });
};

export const signIn: RequestHandler = async (req, res) => {
  const input = signInSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, fullName: true, role: true, passwordHash: true, emailVerifiedAt: true }
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AuthError('We could not sign you in with those details. Check your email and password, then try again.', 401, 'INVALID_CREDENTIALS');
  }
  if (!user.emailVerifiedAt) {
    throw new AuthError('Please verify your email address before signing in.', 403, 'EMAIL_NOT_VERIFIED');
  }

  const { passwordHash: _passwordHash, emailVerifiedAt: _emailVerifiedAt, ...publicUser } = user;
  sendSuccess(res, 200, createSession(publicUser));
};

export const forgotPassword: RequestHandler = async (req, res) => {
  const input = forgotPasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, fullName: true }
  });
  if (user) await issueEmailOtp(user, EmailOtpPurpose.PASSWORD_RESET);
  sendSuccess(res, 200, { message: 'If an account exists for that email, a password reset code has been sent.' });
};

export const resetPassword: RequestHandler = async (req, res) => {
  const input = resetPasswordSchema.parse(req.body);
  const passwordHash = await hashPassword(input.password);
  const reset = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { email: input.email },
      select: { id: true }
    });
    if (!user) return false;

    const consumed = await consumeEmailOtp(tx, user.id, EmailOtpPurpose.PASSWORD_RESET, input.otp);
    if (!consumed) return false;
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
    return true;
  });
  if (!reset) throw new HttpError('The code is invalid or has expired.', 400, 'INVALID_OR_EXPIRED_OTP');
  sendSuccess(res, 200, { message: 'Your password has been reset. You can now sign in.' });
};

export const changePassword: RequestHandler = async (req, res) => {
  const input = changePasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, passwordHash: true }
  });
  if (!user || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new HttpError('Your current password is incorrect.', 400, 'INVALID_CURRENT_PASSWORD');
  }
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  sendSuccess(res, 200, { message: 'Your password has been changed.' });
};
