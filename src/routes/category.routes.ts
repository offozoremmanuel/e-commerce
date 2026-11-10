import { Router } from 'express';
import { getCategory, listCategories } from '../controllers/category.controller.js';

export const categoryRoutes = Router();

categoryRoutes.get('/', listCategories);
categoryRoutes.get('/:id', getCategory);
