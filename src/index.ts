import { OpenAPIHono } from '@hono/zod-openapi';
import { connectDatabase } from './config/database';
import { userController } from './controllers/UserController';
import { getRouterName, showRoutes } from 'hono/dev'
import { swaggerUI } from '@hono/swagger-ui'
import { CronService } from './services/CronService';
import { logger } from './utils/logger';

const app = new OpenAPIHono();
const v1 = new OpenAPIHono();
const cronService = new CronService();

// Mount Swagger UI and docs under v1
v1.get('/ui', swaggerUI({ url: '/api/v1/docs' }))
v1.route('/', userController);

// Mount v1 routes
app.route('/api/v1', v1);

// Connect to database and start services
connectDatabase().then(async () => {
  logger.info('Connected to database');
  
  // Start cron service
  await cronService.start();
  logger.info('Cron service started');

  logger.info('Server is running on http://localhost:3000');
  logger.info("API Documentation:");
  logger.info("- OpenAPI Spec: http://localhost:3000/api/v1/docs");
  logger.info("- Swagger UI: http://localhost:3000/api/v1/ui");
  showRoutes(app);
}).catch(error => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  cronService.stop();
  process.exit(0);
});

export default app; 