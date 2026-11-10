import { app } from './app.js';
import { env } from './config/environment.js';
import { prisma } from './config/database.js';

const server = app.listen(env.PORT, () => {
  console.log(`App listening on port ${env.PORT}`);
});

const shutdown = () => {
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
