import { Context, Next } from "hono";
import { z } from "zod";

export const validateQuery = (schema: z.ZodType) => {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      await schema.parseAsync(query);
      await next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid query parameters", details: error.errors }, 400);
      }
      return c.json({ error: "Validation error" }, 400);
    }
  };
};

export const validateBody = (schema: z.ZodType) => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      await schema.parseAsync(body);
      await next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid request body", details: error.errors }, 400);
      }
      return c.json({ error: "Validation error" }, 400);
    }
  };
};
