import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AuthError } from '../services/auth.service.js';
import { sendError } from '../utils/apiResponse.js';
import { HttpError } from '../utils/httpError.js';

export const notFound: RequestHandler = (_req, res) => {
  sendError(res, 404, 'ROUTE_NOT_FOUND', 'We could not find that page or API route.');
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AuthError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }

  if (error instanceof HttpError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Please check the information you entered and try again.', details: error.flatten() } });
    return;
  }

  console.error(error);
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Something went wrong on our end. Please try again shortly.');
};
