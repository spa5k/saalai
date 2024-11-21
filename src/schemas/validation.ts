import { z } from 'zod';

export const getUsersQuerySchema = z.object({
  limit: z.string().optional().transform((val, ctx) => {
    if (!val) return undefined;
    const parsed = parseInt(val);
    if (isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Not a valid number",
      });
      return z.NEVER;
    }
    return parsed;
  }),
  page: z.string().optional().transform((val, ctx) => {
    if (!val) return undefined;
    const parsed = parseInt(val);
    if (isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Not a valid number",
      });
      return z.NEVER;
    }
    return parsed;
  }),
  sortBy: z.string().optional(),
  search: z.string().optional().transform((val, ctx) => {
    if (!val) return undefined;
    try {
      return JSON.parse(val);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Not a valid JSON",
      });
      return z.NEVER;
    }
  }),
});

export const updateConfigSchema = z.object({
  baseUrl: z.string().url().optional(),
  requestsPerSecond: z.number().min(1).max(10).optional(),
  sleepTime: z.number().min(1000).max(60000).optional(),
  batchSize: z.number().min(1).max(1000).optional(),
  batchSleep: z.number().min(1000).max(60000).optional(),
}); 