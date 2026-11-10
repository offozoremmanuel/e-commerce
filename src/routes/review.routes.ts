import { Router } from 'express';
import { createReview, deleteReview, listProductReviews, updateReview } from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const reviewRoutes = Router();
reviewRoutes.get('/products/:productId', listProductReviews);
reviewRoutes.post('/products/:productId', authenticate, createReview);
reviewRoutes.patch('/:id', authenticate, updateReview);
reviewRoutes.delete('/:id', authenticate, deleteReview);
