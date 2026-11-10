import type { RequestHandler } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HttpError } from '../utils/httpError.js';

const id = z.string().uuid();
const checkoutSchema = z.object({ shippingAddress: z.object({ fullName: z.string().min(2), addressLine1: z.string().min(3), addressLine2: z.string().optional(), city: z.string().min(1), state: z.string().min(1), postalCode: z.string().optional(), country: z.string().min(2), phone: z.string().min(5) }).strict() }).strict();
export const checkout: RequestHandler = async (req, res) => {
  const { shippingAddress } = checkoutSchema.parse(req.body);
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id }, include: { items: { include: { product: true } } } });
  if (!cart?.items.length) throw new HttpError('Add an item to your cart before checking out.', 400, 'EMPTY_CART');
  const currency = cart.items[0]!.product.currency;
  if (cart.items.some(({ product }) => !product.isActive || product.currency !== currency)) throw new HttpError('Some items in your cart are unavailable or cannot be purchased together.', 409, 'INVALID_CART');
  const totalMinor = cart.items.reduce((sum, item) => sum + item.product.priceMinor * BigInt(item.quantity), 0n);
  const order = await prisma.$transaction(async (tx) => {
    for (const item of cart.items) {
      const result = await tx.product.updateMany({ where: { id: item.productId, isActive: true, inventoryQuantity: { gte: item.quantity } }, data: { inventoryQuantity: { decrement: item.quantity } } });
      if (result.count !== 1) throw new HttpError('There is not enough stock to complete this order.', 409, 'INSUFFICIENT_INVENTORY');
    }
    const created = await tx.order.create({ data: { userId: req.user!.id, totalMinor, currency, shippingAddress, items: { create: cart.items.map(({ product, quantity }) => ({ productId: product.id, productName: product.name, unitPriceMinor: product.priceMinor, quantity })) } }, include: { items: true } });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });
  sendSuccess(res, 201, order);
};
export const listOrders: RequestHandler = async (req, res) => sendSuccess(res, 200, await prisma.order.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, include: { items: true, payment: true } }));
export const getOrder: RequestHandler = async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: id.parse(req.params.id) }, include: { items: true, payment: true } });
  if (!order || order.userId !== req.user!.id) throw new HttpError('We could not find that order.', 404, 'ORDER_NOT_FOUND');
  sendSuccess(res, 200, order);
};
export const cancelOrder: RequestHandler = async (req, res) => {
  const orderId = id.parse(req.params.id);
  const order = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!current || current.userId !== req.user!.id) throw new HttpError('We could not find that order.', 404, 'ORDER_NOT_FOUND');
    if (current.status !== 'PENDING') throw new HttpError('This order can no longer be cancelled.', 409, 'ORDER_NOT_CANCELLABLE');
    const updated = await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' }, include: { items: true } });
    for (const item of current.items) if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { inventoryQuantity: { increment: item.quantity } } });
    return updated;
  });
  sendSuccess(res, 200, order);
};
