import express, { type RequestHandler } from 'express';
import { HttpError } from '../utils/httpError.js';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const parseImageBody = express.raw({ type: allowedImageTypes, limit: '8mb' });

export const uploadImageBody: RequestHandler = (req, res, next) => {
  if (!req.is(allowedImageTypes)) {
    next(new HttpError('Upload a JPEG, PNG, or WebP image.', 415, 'UNSUPPORTED_IMAGE_TYPE'));
    return;
  }

  parseImageBody(req, res, (error) => {
    if (error) {
      const tooLarge = (error as { type?: string }).type === 'entity.too.large';
      next(new HttpError(
        tooLarge ? 'Choose an image smaller than 8 MB.' : 'We could not read the uploaded image. Please try again.',
        tooLarge ? 413 : 400,
        tooLarge ? 'IMAGE_TOO_LARGE' : 'INVALID_IMAGE_UPLOAD'
      ));
      return;
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      next(new HttpError('Choose an image to upload.', 400, 'IMAGE_REQUIRED'));
      return;
    }

    next();
  });
};
