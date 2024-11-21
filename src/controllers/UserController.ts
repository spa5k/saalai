import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import { UserService } from '../services/UserService';
import { RandomUserService } from '../services/RandomUserService';
import { UserSchema, UsersQuerySchema, ApiConfigSchema } from '../schemas/openapi';
import { logger } from '../utils/logger';

const app = new OpenAPIHono();
const userService = new UserService();
const randomUserService = new RandomUserService();

// Define routes
const getUsersRoute = createRoute({
  method: 'get',
  path: '/users',
  request: {
    query: UsersQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            total: z.number(),
            limit: z.number(),
            page: z.number(),
            sortBy: z.string(),
            items: z.array(UserSchema),
          }).openapi('PaginatedUsers'),
        },
      },
      description: 'Successfully retrieved users',
    },
    500: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Internal Server Error',
    },
  },
  tags: ['Users'],
  summary: 'Get paginated users list',
});

const fetchUsersRoute = createRoute({
  method: 'post',
  path: '/users/fetch',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            progressId: z.string(),
            progress: z.object({
              totalBatches: z.number(),
              completedBatches: z.number(),
              pendingBatches: z.number(),
              status: z.enum(['running', 'completed', 'failed']),
            }),
          }).openapi('FetchUsersResponse'),
        },
      },
      description: 'User fetch process started',
    },
    500: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Internal Server Error',
    },
  },
  tags: ['Users'],
  summary: 'Start fetching users from external API',
});

const updateConfigRoute = createRoute({
  method: 'put',
  path: '/config/random-user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ApiConfigSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: 'Configuration updated successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Invalid request body',
    },
    500: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Internal Server Error',
    },
  },
  tags: ['Configuration'],
  summary: 'Update Random User API configuration',
});

const getBatchProgressRoute = createRoute({
  method: 'get',
  path: '/users/fetch/{progressId}',
  request: {
    params: z.object({
      progressId: z.string().openapi({
        param: {
          name: 'progressId',
          in: 'path',
        },
        example: '507f1f77bcf86cd799439011',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            progress: z.object({
              totalBatches: z.number(),
              completedBatches: z.number(),
              pendingBatches: z.number(),
              status: z.enum(['running', 'completed', 'failed']),
              error: z.string().optional(),
            }),
          }),
        },
      },
      description: 'Batch progress status',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Progress not found',
    },
    500: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Internal Server Error',
    },
  },
  tags: ['Users'],
  summary: 'Get batch progress status',
});

// Register routes
app.openapi(getUsersRoute, async (c) => {
  try {
    const { limit, page, sortBy, search } = c.req.valid('query');
    logger.info('Fetching users', { limit, page, sortBy, search });
    
    const result = await userService.getUsers({
      limit: limit ? parseInt(limit) : undefined,
      page: page ? parseInt(page) : undefined,
      sortBy,
      search: search ? JSON.parse(search) : undefined,
    });

    return c.json(result, 200);
  } catch (error) {
    logger.error('Error fetching users', { error });
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.openapi(fetchUsersRoute, async (c) => {
  try {
    logger.info('Starting user fetch process');
    const progress = await randomUserService.fetchAndStoreUsers();
    
    const response = {
      message: 'User fetch process started',
      progressId: progress._id.toString(),
      progress: {
        totalBatches: progress.totalBatches,
        completedBatches: progress.completedBatches,
        pendingBatches: progress.pendingBatches,
        status: progress.status,
      },
    } as const;

    return c.json(response, 200);
  } catch (error) {
    logger.error('Error starting user fetch', { error });
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.openapi(updateConfigRoute, async (c) => {
  try {
    const body = c.req.valid('json');
    logger.info('Updating random user config', { config: body });
    await randomUserService.updateConfig(body);
    return c.json({ message: 'Configuration updated successfully' }, 200);
  } catch (error) {
    logger.error('Error updating config', { error });
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request body' }, 400);
    }
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.openapi(getBatchProgressRoute, async (c) => {
  try {
    const { progressId } = c.req.valid('param');
    const progress = await randomUserService.getBatchProgress(progressId);
    
    if (!progress) {
      return c.json({ error: 'Progress not found' }, 404);
    }

    return c.json({
      progress: {
        totalBatches: progress.totalBatches,
        completedBatches: progress.completedBatches,
        pendingBatches: progress.pendingBatches,
        status: progress.status,
        ...(progress.error && { error: progress.error }),
      },
    }, 200);
  } catch (error) {
    logger.error('Error fetching batch progress', { error });
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Add OpenAPI documentation
app.doc('/docs', {
  openapi: '3.0.0',
  info: {
    title: 'Random User API',
    version: '1.0.0',
    description: 'API for managing random user data with configurable fetching',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Version 1',
    },
  ],
});

export { app as userController }; 