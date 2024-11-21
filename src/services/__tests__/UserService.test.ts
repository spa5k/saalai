import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../UserService';
import { User } from '../../models/User';

// Mock the User model
vi.mock('../../models/User', () => ({
  User: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  const mockUsers = [
    {
      _id: '1',
      gender: 'male',
      name: 'Test User',
      address: {
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        street: 'Test Street',
      },
      email: 'test@example.com',
      age: '25',
      picture: 'https://example.com/test.jpg',
      createdAt: new Date('2024-01-01'),
    },
    {
      _id: '2',
      gender: 'female',
      name: 'Jane Smith',
      address: {
        city: 'Another City',
        state: 'Another State',
        country: 'Another Country',
        street: 'Another Street',
      },
      email: 'jane@example.com',
      age: '30',
      picture: 'https://example.com/jane.jpg',
      createdAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    userService = new UserService();
    vi.clearAllMocks();

    // Setup default mock implementations
    const mockFind = vi.fn().mockReturnThis();
    const mockSort = vi.fn().mockReturnThis();
    const mockSkip = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue(mockUsers);

    (User.find as any).mockImplementation(() => ({
      sort: mockSort,
      skip: mockSkip,
      limit: mockLimit,
    }));

    (User.countDocuments as any).mockResolvedValue(mockUsers.length);
  });

  describe('getUsers', () => {
    it('should return paginated users with default parameters', async () => {
      const result = await userService.getUsers({});

      expect(result).toEqual({
        total: 2,
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

      expect(User.find).toHaveBeenCalledWith({});
    });

    it('should apply search filters correctly', async () => {
      const searchQuery = { name: 'Test' };
      const filteredMockUsers = [mockUsers[0]];

      (User.find as any).mockImplementation(() => ({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(filteredMockUsers),
      }));
      (User.countDocuments as any).mockResolvedValue(1);

      const result = await userService.getUsers({ search: searchQuery });

      expect(result.total).toBe(1);
      expect(result.items[0]).toMatchObject({
        name: 'Test User',
        email: 'test@example.com',
      });

      expect(User.find).toHaveBeenCalledWith({
        name: { $regex: 'Test', $options: 'i' },
      });
    });

    it('should apply pagination correctly', async () => {
      const firstPageMock = [mockUsers[0]];
      const secondPageMock = [mockUsers[1]];

      // First page
      (User.find as any).mockImplementation(() => ({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(firstPageMock),
      }));

      const firstPage = await userService.getUsers({
        limit: 1,
        page: 1,
      });

      expect(firstPage).toMatchObject({
        total: 2,
        limit: 1,
        page: 1,
        items: [expect.objectContaining({ name: 'Test User' })],
      });

      // Second page
      (User.find as any).mockImplementation(() => ({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(secondPageMock),
      }));

      const secondPage = await userService.getUsers({
        limit: 1,
        page: 2,
      });

      expect(secondPage).toMatchObject({
        total: 2,
        limit: 1,
        page: 2,
        items: [expect.objectContaining({ name: 'Jane Smith' })],
      });
    });

    it('should sort results correctly', async () => {
      // Test ascending sort
      const ascMock = [...mockUsers].sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      );

      (User.find as any).mockImplementation(() => ({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(ascMock),
      }));

      const ascResult = await userService.getUsers({
        sortBy: 'createdAt',
      });

      expect(ascResult.items[0].name).toBe('Test User');
      expect(ascResult.items[1].name).toBe('Jane Smith');

      // Test descending sort
      const descMock = [...mockUsers].sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      (User.find as any).mockImplementation(() => ({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(descMock),
      }));

      const descResult = await userService.getUsers({
        sortBy: '-createdAt',
      });

      expect(descResult.items[0].name).toBe('Jane Smith');
      expect(descResult.items[1].name).toBe('Test User');
    });

    it('should handle empty results', async () => {
      (User.find as any).mockImplementation(() => ({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }));
      (User.countDocuments as any).mockResolvedValue(0);

      const result = await userService.getUsers({});

      expect(result).toEqual({
        total: 0,
        limit: 10,
        page: 1,
        sortBy: 'createdAt',
        items: [],
      });
    });
  });
}); 