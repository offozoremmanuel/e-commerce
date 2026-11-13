import cors from 'cors';
import express, { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { prisma } from './config/database.js';
import { env } from './config/environment.js';
import { openApiSpec } from './docs/swaggerDocs.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { productRoutes } from './routes/product.routes.js';
import { categoryRoutes } from './routes/category.routes.js';
import { cartRoutes } from './routes/cart.routes.js';
import { orderRoutes } from './routes/order.routes.js';
import { reviewRoutes } from './routes/review.routes.js';

export const app = express();
const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.get('/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 }));
app.get('/api-docs.json', (_req, res) => res.json(openApiSpec));
const swaggerContentSecurityPolicy: RequestHandler = (_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  next();
};
app.use('/api-docs', swaggerContentSecurityPolicy, swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true, customSiteTitle: 'E-commerce API documentation' }));
app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);
