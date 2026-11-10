import { Router } from 'express';
import { cancelOrder, checkout, getOrder, listOrders } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const orderRoutes = Router();
orderRoutes.use(authenticate);
orderRoutes.post('/checkout', checkout);
orderRoutes.get('/', listOrders);
orderRoutes.get('/:id', getOrder);
orderRoutes.post('/:id/cancel', cancelOrder);
