import { z } from "@hono/zod-openapi";

// Address Schema
export const AddressSchema = z.object({
  city: z.string().openapi({
    example: "New York",
  }),
  state: z.string().openapi({
    example: "NY",
  }),
  country: z.string().openapi({
    example: "USA",
  }),
  street: z.string().openapi({
    example: "123 Main St",
  }),
}).openapi("Address");

// User Schema
export const UserSchema = z.object({
  id: z.string().openapi({
    example: "507f1f77bcf86cd799439011",
  }),
  gender: z.string().openapi({
    example: "male",
  }),
  name: z.string().openapi({
    example: "John Doe",
  }),
  address: AddressSchema,
  email: z.string().email().openapi({
    example: "john@example.com",
  }),
  age: z.string().openapi({
    example: "30",
  }),
  picture: z.string().url().openapi({
    example: "https://example.com/avatar.jpg",
  }),
  createdAt: z.date().openapi({
    example: new Date().toISOString(),
  }),
}).openapi("User");

// Query Parameters Schema
export const UsersQuerySchema = z.object({
  limit: z.string().optional().openapi({
    param: {
      name: "limit",
      in: "query",
    },
    example: "10",
  }),
  page: z.string().optional().openapi({
    param: {
      name: "page",
      in: "query",
    },
    example: "1",
  }),
  sortBy: z.string().optional().openapi({
    param: {
      name: "sortBy",
      in: "query",
    },
    example: "createdAt",
  }),
  search: z.string().optional().openapi({
    param: {
      name: "search",
      in: "query",
    },
    example: "{\"name\":\"John\"}",
  }),
}).openapi("UsersQuery");

// API Config Schema
export const ApiConfigSchema = z.object({
  baseUrl: z.string().url().openapi({
    example: "https://randomuser.me/api/",
  }),
  requestsPerSecond: z.number().min(1).max(10).openapi({
    example: 5,
  }),
  sleepTime: z.number().min(1000).max(60000).openapi({
    example: 30000,
  }),
  batchSize: z.number().min(1).max(1000).openapi({
    example: 300,
  }),
  batchSleep: z.number().min(1000).max(60000).openapi({
    example: 5000,
  }),
}).openapi("ApiConfig");
