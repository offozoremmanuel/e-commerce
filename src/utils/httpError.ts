export class HttpError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code = 'REQUEST_FAILED'
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
