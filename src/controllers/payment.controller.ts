import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HttpError } from '../utils/httpError.js';

export const initializePayment: RequestHandler = async (req, res) => {
  const orderId = z.string().uuid().parse(req.params.orderId);
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order || order.userId !== req.user!.id) throw new HttpError('We could not find that order.', 404, 'ORDER_NOT_FOUND');
  if (order.status !== 'PENDING') throw new HttpError('This order is not available for payment.', 409, 'ORDER_NOT_PAYABLE');
  if (order.payment) { sendSuccess(res, 200, order.payment); return; }
  const reference = `pay_${randomUUID()}`;
  const payment = await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { paymentReference: reference } });
    return tx.payment.create({ data: { orderId, reference, amountMinor: order.totalMinor, currency: order.currency } });
  });
  sendSuccess(res, 201, payment);
};

export const getPayment: RequestHandler = async (req, res) => {
  const reference = z.string().min(1).parse(req.params.reference);
  const payment = await prisma.payment.findUnique({ where: { reference }, include: { order: { select: { id: true, userId: true, status: true } } } });
  if (!payment || payment.order.userId !== req.user!.id) throw new HttpError('We could not find that payment.', 404, 'PAYMENT_NOT_FOUND');
  const { order, ...result } = payment;
  sendSuccess(res, 200, { ...result, order: { id: order.id, status: order.status } });
};
