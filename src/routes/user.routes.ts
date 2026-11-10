import { Router } from 'express';
import { deleteAccount, getProfile, updateProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const userRoutes = Router();
userRoutes.use(authenticate);
userRoutes.get('/me', getProfile);
userRoutes.patch('/me', updateProfile);
userRoutes.delete('/me', deleteAccount);
