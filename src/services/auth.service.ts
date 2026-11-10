import { generateToken } from '../utils/generateToken.js';

export class AuthError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: 'EMAIL_IN_USE' | 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function createSession(user: { id: string; email: string; fullName: string; role: string }) {
  return {
    accessToken: generateToken(user.id, user.role),
    tokenType: 'Bearer',
    expiresIn: 3600,
    user
  };
}
