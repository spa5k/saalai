import { config } from "../config/config";
import { IUserDocument, User } from "../models/User";
import { validateSearchQuery } from "../schemas/validation";
import { IItems, IPagination } from "../types";

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

    const [documents, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);
    const items = documents.map((doc: IUserDocument) => ({
      id: (doc as any)._id.toString(),
      gender: doc.gender,
      name: doc.name,
      address: doc.address,
      email: doc.email,
      age: doc.age,
      picture: doc.picture,
      createdAt: doc.createdAt,
    }));

    return {
      total,
      limit,
      page,
      sortBy,
      items,
    };
  }

  private buildSearchQuery(search?: Record<string, any>): Record<string, any> {
    if (!search) return {};

    const validatedSearch = validateSearchQuery(search);
    const query: Record<string, any> = {};

    Object.entries(validatedSearch).forEach(([key, value]) => {
      if (value) {
        if (key === "name" || key === "email") {
          query[key] = { $regex: value, $options: "i" };
        } else if (key === "age") {
          query[key] = value;
        } else if (key === "country") {
          query["address.country"] = { $regex: value, $options: "i" };
        } else {
          query[key] = value;
        }
      }
    });

    return query;
  }

  private buildSortQuery(sortBy: string): Record<string, 1 | -1> {
    const sort: Record<string, 1 | -1> = {};
    if (sortBy.startsWith("-")) {
      sort[sortBy.substring(1)] = -1;
    } else {
      sort[sortBy] = 1;
    }
    return sort;
  }
}
