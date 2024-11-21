import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userController } from '../UserController';
import { UserService } from '../../services/UserService';
import { RandomUserService } from '../../services/RandomUserService';
import { createMockBatchProgress } from '../../__tests__/helpers/mockBatchProgress';

// Mock services
vi.mock('../../services/UserService');
vi.mock('../../services/RandomUserService');
vi.mock('../../utils/logger');

describe('UserController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (path: string, options: RequestInit = {}): Request => {
    const url = new URL(`http://localhost${path}`);
    return new Request(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  };

  describe('GET /users', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          gender: 'male',
          age: '25',
          picture: 'https://example.com/pic.jpg',
          address: {
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            street: 'Test Street',
          },
          createdAt: new Date(),
        },
      ];

      vi.mocked(UserService.prototype.getUsers).mockResolvedValue({
        total: 1,
        limit: 10,
        page: 1,
        sortBy: 'createdAt',
        items: mockUsers,
      });

      const res = await userController.fetch(createRequest('/users'));

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({
        total: 1,
        limit: 10,
        page: 1,
        sortBy: 'createdAt',
        items: expect.arrayContaining([
          expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com',
          }),
        ]),
      });
    });

    it('should handle search parameters', async () => {
      const searchQuery = { name: 'Test' };
      const mockUsers = [
        {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          gender: 'male',
          age: '25',
          picture: 'https://example.com/pic.jpg',
          address: {
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            street: 'Test Street',
          },
          createdAt: new Date(),
        },
      ];

      vi.mocked(UserService.prototype.getUsers).mockResolvedValue({
        total: 1,
        limit: 10,
        page: 1,
        sortBy: 'createdAt',
        items: mockUsers,
      });

      const res = await userController.fetch(
        createRequest(`/users?search=${encodeURIComponent(JSON.stringify(searchQuery))}`)
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].name).toBe('Test User');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(UserService.prototype.getUsers).mockRejectedValue(new Error('Database error'));

      const res = await userController.fetch(createRequest('/users'));

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('POST /users/fetch', () => {
    it('should start user fetch process', async () => {
      const mockProgress = createMockBatchProgress({
        totalBatches: 2,
        completedBatches: 0,
        pendingBatches: 2,
        status: 'pending'
      });

      // @ts-ignore
      vi.mocked(RandomUserService.prototype.fetchAndStoreUsers).mockResolvedValue(mockProgress);

      const res = await userController.fetch(
        createRequest('/users/fetch', { method: 'POST' })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({
        message: 'User fetch process started',
        progressId: mockProgress._id.toString(),
        progress: {
          totalBatches: mockProgress.totalBatches,
          completedBatches: mockProgress.completedBatches,
          pendingBatches: mockProgress.pendingBatches,
          status: mockProgress.status,
        },
      });
    });
  });

  describe('GET /users/fetch/:progressId', () => {
    it('should return batch progress', async () => {
      const mockProgress = createMockBatchProgress({
        completedBatches: 1,
        pendingBatches: 1,
        totalBatches: 2,
        status: 'in_progress'
      });
      // @ts-ignore
      vi.mocked(RandomUserService.prototype.getBatchProgress).mockResolvedValue(mockProgress);

      const res = await userController.fetch(
        createRequest(`/users/fetch/${mockProgress._id.toString()}`)
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({
        progress: {
          totalBatches: mockProgress.totalBatches,
          completedBatches: mockProgress.completedBatches,
          pendingBatches: mockProgress.pendingBatches,
          status: mockProgress.status,
        },
      });
    });

    it('should return 404 for non-existent progress', async () => {
      vi.mocked(RandomUserService.prototype.getBatchProgress).mockResolvedValue(null);

      const res = await userController.fetch(
        createRequest('/users/fetch/nonexistent-id')
      );

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toEqual({ error: 'Progress not found' });
    });
  });
}); 