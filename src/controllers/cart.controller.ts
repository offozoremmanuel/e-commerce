import type { RequestHandler } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HttpError } from '../utils/httpError.js';

const itemSchema = z.object({ productId: z.string().uuid(), quantity: z.coerce.number().int().positive().max(99) }).strict();
const cartInclude = { items: { include: { product: true } } } as const;
async function getOrCreateCart(userId: string) { return prisma.cart.upsert({ where: { userId }, create: { userId }, update: {}, include: cartInclude }); }
export const getCart: RequestHandler = async (req, res) => sendSuccess(res, 200, await getOrCreateCart(req.user!.id));
export const addCartItem: RequestHandler = async (req, res) => {
  const { productId, quantity } = itemSchema.parse(req.body);
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) throw new HttpError('We could not find that product.', 404, 'PRODUCT_NOT_FOUND');
  const cart = await getOrCreateCart(req.user!.id);
  const current = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
  const nextQuantity = (current?.quantity ?? 0) + quantity;
  if (nextQuantity > product.inventoryQuantity) throw new HttpError('There is not enough stock for that quantity.', 409, 'INSUFFICIENT_INVENTORY');
  await prisma.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId } }, create: { cartId: cart.id, productId, quantity }, update: { quantity: nextQuantity } });
  sendSuccess(res, 200, await prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude }));
};
export const updateCartItem: RequestHandler = async (req, res) => {
  const quantity = z.coerce.number().int().positive().max(99).parse(req.body.quantity);
  const productId = z.string().uuid().parse(req.params.productId);
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (!cart) throw new HttpError('That item is not in your cart.', 404, 'CART_ITEM_NOT_FOUND');
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product || quantity > product.inventoryQuantity) throw new HttpError('There is not enough stock for that quantity.', 409, 'INSUFFICIENT_INVENTORY');
  await prisma.cartItem.update({ where: { cartId_productId: { cartId: cart.id, productId } }, data: { quantity } });
  sendSuccess(res, 200, await prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude }));
};
export const removeCartItem: RequestHandler = async (req, res) => {
  const productId = z.string().uuid().parse(req.params.productId), cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (!cart) throw new HttpError('That item is not in your cart.', 404, 'CART_ITEM_NOT_FOUND');
  await prisma.cartItem.delete({ where: { cartId_productId: { cartId: cart.id, productId } } });
  res.status(204).end();
};
export const clearCart: RequestHandler = async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  res.status(204).end();
};
