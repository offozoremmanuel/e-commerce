import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  BREVO_API_KEY: z.string().trim().optional(),
  BREVO_SENDER_EMAIL: z.string().trim().email().optional(),
  BREVO_SENDER_NAME: z.string().trim().min(1).optional(),
  cloudinaryApiKey: z.string().trim().optional(),
  cloudinaryApiSecret: z.string().trim().optional(),
  cloudinaryCloudName: z.string().trim().optional()
});

export const env = envSchema.parse(process.env);
