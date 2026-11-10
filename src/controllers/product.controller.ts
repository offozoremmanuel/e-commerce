import type { RequestHandler } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HttpError } from '../utils/httpError.js';

const idSchema = z.string().uuid();

export const listProducts: RequestHandler = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const where = { isActive: true, ...(typeof req.query.categoryId === 'string' ? { categoryId: idSchema.parse(req.query.categoryId) } : {}), ...(typeof req.query.q === 'string' ? { name: { contains: req.query.q, mode: 'insensitive' as const } } : {}) };
  const [products, total] = await prisma.$transaction([prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { category: true } }), prisma.product.count({ where })]);
  sendSuccess(res, 200, { products, page, limit, total });
};

export const getProduct: RequestHandler = async (req, res) => {
  const product = await prisma.product.findFirst({ where: { id: idSchema.parse(req.params.id), isActive: true }, include: { category: true } });
  if (!product) throw new HttpError('We could not find that product.', 404, 'PRODUCT_NOT_FOUND');
  sendSuccess(res, 200, product);
};
