import { Router } from 'express';
import { getProduct, listProducts } from '../controllers/product.controller.js';

export const productRoutes = Router();
productRoutes.get('/', listProducts);
productRoutes.get('/:id', getProduct);
