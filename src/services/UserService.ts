import { User } from '../models/User';
import { IPagination, IItems } from '../types';
import { config } from '../config/config';

export class UserService {
  public async getUsers(params: {
    limit?: number;
    page?: number;
    sortBy?: string;
    search?: Record<string, any>;
  }): Promise<IPagination> {
    const limit = params.limit || config.pagination.defaultLimit;
    const page = params.page || config.pagination.defaultPage;
    const sortBy = params.sortBy || config.pagination.defaultSortBy;
    const skip = (page - 1) * limit;

    const query = this.buildSearchQuery(params.search);
    const sort = this.buildSortQuery(sortBy);

    const [items, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      total,
      limit,
      page,
      sortBy,
      items: items as IItems[],
    };
  }

  private buildSearchQuery(search?: Record<string, any>): Record<string, any> {
    if (!search) return {};

    const query: Record<string, any> = {};
    Object.entries(search).forEach(([key, value]) => {
      if (value) {
        if (key === 'name' || key === 'email') {
          query[key] = { $regex: value, $options: 'i' };
        } else {
          query[key] = value;
        }
      }
    });

    return query;
  }

  private buildSortQuery(sortBy: string): Record<string, 1 | -1> {
    const sort: Record<string, 1 | -1> = {};
    if (sortBy.startsWith('-')) {
      sort[sortBy.substring(1)] = -1;
    } else {
      sort[sortBy] = 1;
    }
    return sort;
  }
} 