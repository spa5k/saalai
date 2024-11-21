import { UserService } from '../UserService';
import { User } from '../../models/User';
import mongoose from 'mongoose';

jest.mock('../../models/User');

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return paginated users with default parameters', async () => {
      const mockUsers = [{ name: 'Test User' }];
      const mockCount = 1;

      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockUsers),
            }),
          }),
        }),
      });

      (User.countDocuments as jest.Mock).mockResolvedValue(mockCount);

      const result = await userService.getUsers({});

      expect(result).toEqual({
        total: mockCount,
        limit: 10,
        page: 1,
        sortBy: 'createdAt',
        items: mockUsers,
      });
    });

    it('should apply search filters correctly', async () => {
      const search = { name: 'John', gender: 'male' };
      await userService.getUsers({ search });

      expect(User.find).toHaveBeenCalledWith({
        name: { $regex: 'John', $options: 'i' },
        gender: 'male',
      });
    });
  });
}); 