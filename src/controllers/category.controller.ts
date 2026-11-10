import type { RequestHandler } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HttpError } from '../utils/httpError.js';

const id = z.string().uuid();
export const listCategories: RequestHandler = async (_req, res) => sendSuccess(res, 200, await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } }));
export const getCategory: RequestHandler = async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: id.parse(req.params.id) }, include: { _count: { select: { products: true } } } });
  if (!category) throw new HttpError('We could not find that category.', 404, 'CATEGORY_NOT_FOUND');
  sendSuccess(res, 200, category);
};
