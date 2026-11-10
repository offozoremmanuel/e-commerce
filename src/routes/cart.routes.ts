import { Router } from 'express';
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from '../controllers/cart.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const cartRoutes = Router();
cartRoutes.use(authenticate);
cartRoutes.get('/', getCart);
cartRoutes.post('/items', addCartItem);
cartRoutes.patch('/items/:productId', updateCartItem);
cartRoutes.delete('/items/:productId', removeCartItem);
cartRoutes.delete('/', clearCart);
