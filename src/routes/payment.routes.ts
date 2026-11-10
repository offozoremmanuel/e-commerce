import { Router } from 'express';
import { getPayment, initializePayment } from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const paymentRoutes = Router();
paymentRoutes.use(authenticate);
paymentRoutes.post('/orders/:orderId/initialize', initializePayment);
paymentRoutes.get('/:reference', getPayment);
