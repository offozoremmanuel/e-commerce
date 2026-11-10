import type { RequestHandler } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HttpError } from '../utils/httpError.js';

const profileSchema = z.object({ fullName: z.string().trim().min(2).max(100) }).strict();

export const getProfile: RequestHandler = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, email: true, fullName: true, role: true, createdAt: true } });
  if (!user) throw new HttpError('We could not find your account.', 404, 'USER_NOT_FOUND');
  sendSuccess(res, 200, user);
};

export const updateProfile: RequestHandler = async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: profileSchema.parse(req.body), select: { id: true, email: true, fullName: true, role: true, updatedAt: true } });
  sendSuccess(res, 200, user);
};

export const deleteAccount: RequestHandler = async (req, res) => {
  await prisma.user.delete({ where: { id: req.user!.id } });
  res.status(204).end();
};
