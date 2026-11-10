import type { RequestHandler } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HttpError } from '../utils/httpError.js';

const id = z.string().uuid();
const reviewSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(2000).default('') }).strict();
export const listProductReviews: RequestHandler = async (req, res) => sendSuccess(res, 200, await prisma.review.findMany({ where: { productId: id.parse(req.params.productId) }, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, fullName: true } } } }));
export const createReview: RequestHandler = async (req, res) => {
  const productId = id.parse(req.params.productId);
  if (!(await prisma.product.findFirst({ where: { id: productId, isActive: true } }))) throw new HttpError('We could not find that product.', 404, 'PRODUCT_NOT_FOUND');
  const purchased = await prisma.orderItem.findFirst({ where: { productId, order: { userId: req.user!.id, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } } });
  if (!purchased) throw new HttpError('You can leave a review after purchasing this product.', 403, 'PURCHASE_REQUIRED');
  sendSuccess(res, 201, await prisma.review.create({ data: { ...reviewSchema.parse(req.body), productId, userId: req.user!.id }, include: { user: { select: { id: true, fullName: true } } } }));
};
export const updateReview: RequestHandler = async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: id.parse(req.params.id) } });
  if (!review || review.userId !== req.user!.id) throw new HttpError('We could not find that review.', 404, 'REVIEW_NOT_FOUND');
  sendSuccess(res, 200, await prisma.review.update({ where: { id: review.id }, data: reviewSchema.partial().parse(req.body), include: { user: { select: { id: true, fullName: true } } } }));
};
export const deleteReview: RequestHandler = async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: id.parse(req.params.id) } });
  if (!review || review.userId !== req.user!.id) throw new HttpError('We could not find that review.', 404, 'REVIEW_NOT_FOUND');
  await prisma.review.delete({ where: { id: review.id } });
  res.status(204).end();
};
