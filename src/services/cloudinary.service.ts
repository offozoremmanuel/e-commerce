import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/environment.js';
import { HttpError } from '../utils/httpError.js';

export type UploadedImage = {
  url: string;
};

export async function uploadProductImage(image: Buffer): Promise<UploadedImage> {
  const { cloudinaryApiKey, cloudinaryApiSecret, cloudinaryCloudName } = env;
  if (!cloudinaryApiKey || !cloudinaryApiSecret || !cloudinaryCloudName) {
    throw new HttpError('Image uploads are not configured yet. Please contact the store administrator.', 503, 'IMAGE_UPLOAD_UNAVAILABLE');
  }

  cloudinary.config({
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
    cloud_name: cloudinaryCloudName
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'e-commerce/products', resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(new HttpError('We could not upload that image. Please try again.', 502, 'IMAGE_UPLOAD_FAILED'));
          return;
        }

        resolve({ url: result.secure_url });
      }
    );

    stream.end(image);
  });
}
