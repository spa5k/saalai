import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { connectDatabase } from './config/database';
import { userController } from './controllers/UserController';

const app = new Hono();

app.route('/api', userController);

connectDatabase().then(() => {
  serve(app, () => {
    console.log('Server is running on http://localhost:3000');
  });
}); 