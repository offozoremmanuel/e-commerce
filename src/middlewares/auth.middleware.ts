import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';
import { sendError } from '../utils/apiResponse.js';

export const authenticate: RequestHandler = (req, res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    sendError(res, 401, 'UNAUTHORIZED', 'Please sign in to continue.');
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'e-commerce-api',
      audience: 'e-commerce-api'
    });
    if (typeof payload === 'string' || !payload.sub || typeof payload.role !== 'string') {
      sendError(res, 401, 'INVALID_TOKEN', 'Your session is invalid. Please sign in again.');
      return;
    }
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    sendError(res, 401, 'INVALID_TOKEN', 'Your session has expired. Please sign in again.');
  }
};
