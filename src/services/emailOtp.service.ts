import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { Prisma } from '../generated/prisma/client.js';
import { env } from '../config/environment.js';
import { prisma } from '../config/database.js';
import { EmailOtpPurpose } from '../generated/prisma/enums.js';
import { HttpError } from '../utils/httpError.js';
import { sendOtpEmail } from '../utils/sendEmail.js';

const otpLifetimeMs = 10 * 60 * 1000;
const maxAttempts = 5;

function hashOtp(userId: string, purpose: EmailOtpPurpose, otp: string): string {
  return createHmac('sha256', env.JWT_SECRET)
    .update(`${userId}:${purpose}:${otp}`)
    .digest('hex');
}

export async function issueEmailOtp(
  user: { id: string; email: string; fullName: string },
  purpose: EmailOtpPurpose
): Promise<void> {
  const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
  await prisma.emailOtp.upsert({
    where: { userId_purpose: { userId: user.id, purpose } },
    create: {
      userId: user.id,
      purpose,
      codeHash: hashOtp(user.id, purpose, otp),
      expiresAt: new Date(Date.now() + otpLifetimeMs)
    },
    update: {
      codeHash: hashOtp(user.id, purpose, otp),
      expiresAt: new Date(Date.now() + otpLifetimeMs),
      attempts: 0,
      createdAt: new Date()
    }
  });

  await sendOtpEmail(
    { email: user.email, fullName: user.fullName },
    otp,
    purpose === EmailOtpPurpose.SIGNUP ? 'signup' : 'password-reset'
  );
}

export async function consumeEmailOtp(
  tx: Prisma.TransactionClient,
  userId: string,
  purpose: EmailOtpPurpose,
  otp: string
): Promise<boolean> {
  const record = await tx.emailOtp.findUnique({
    where: { userId_purpose: { userId, purpose } }
  });
  const now = new Date();
  if (!record || record.expiresAt <= now) {
    if (record) await tx.emailOtp.delete({ where: { id: record.id } });
    return false;
  }

  const suppliedHash = Buffer.from(hashOtp(userId, purpose, otp), 'hex');
  const storedHash = Buffer.from(record.codeHash, 'hex');
  if (!timingSafeEqual(suppliedHash, storedHash)) {
    if (record.attempts + 1 >= maxAttempts) {
      await tx.emailOtp.deleteMany({ where: { id: record.id, attempts: record.attempts } });
    } else {
      await tx.emailOtp.updateMany({
        where: { id: record.id, attempts: record.attempts },
        data: { attempts: { increment: 1 } }
      });
    }
    return false;
  }

  const consumed = await tx.emailOtp.deleteMany({
    where: {
      id: record.id,
      codeHash: record.codeHash,
      expiresAt: { gt: now },
      attempts: { lt: maxAttempts }
    }
  });
  return consumed.count === 1;
}
