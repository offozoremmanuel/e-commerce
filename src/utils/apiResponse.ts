import type { Response } from 'express';

export function sendSuccess<T>(res: Response, status: number, data: T) {
  return res.status(status).json({ data: JSON.parse(JSON.stringify(data, (_key, value) => typeof value === 'bigint' ? value.toString() : value)) });
}

export function sendError(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}
