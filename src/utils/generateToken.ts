import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ role }, env.JWT_SECRET, {
    subject: userId,
    issuer: 'e-commerce-api',
    audience: 'e-commerce-api',
    expiresIn: '1h'
  });
}
