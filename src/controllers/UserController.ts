import { Hono } from 'hono';
import { Context } from 'hono/dist/types';
import { UserService } from '../services/UserService';
import { RandomUserService } from '../services/RandomUserService';

const app = new Hono();
const userService = new UserService();
const randomUserService = new RandomUserService();

app.get('/users', async (c: Context) => {
  const { limit, page, sortBy } = c.req.query();
  const search = c.req.query('search') ? JSON.parse(c.req.query('search')!) : undefined;

  try {
    const result = await userService.getUsers({
      limit: limit ? parseInt(limit) : undefined,
      page: page ? parseInt(page) : undefined,
      sortBy,
      search,
    });

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.post('/users/fetch', async (c: Context) => {
  try {
    await randomUserService.fetchAndStoreUsers();
    return c.json({ message: 'User fetch process started' });
  } catch (error) {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export { app as userController }; 