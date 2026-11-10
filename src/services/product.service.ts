import { z } from 'zod';
import { prisma } from '../config/database.js';

const productInput = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  sku: z.string().trim().min(1).max(100),
  priceMinor: z.coerce.number().int().positive().safe(),
  currency: z.string().trim().length(3).default('NGN'),
  inventoryQuantity: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().url().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional()
}).strict();

export type NewProduct = z.input<typeof productInput>;

export async function createProduct(input: NewProduct) {
  const data = productInput.parse(input);
  return prisma.product.create({ data: { ...data, priceMinor: BigInt(data.priceMinor) } });
}
