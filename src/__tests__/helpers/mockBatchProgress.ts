import { Types } from "mongoose";
import type { IBatchProgress } from "../../models/BatchProgress";

export const createMockBatchProgress = (overrides = {}): Partial<IBatchProgress> & { _id: Types.ObjectId } => ({
  _id: new Types.ObjectId(),
  totalBatches: 2,
  completedBatches: 0,
  pendingBatches: 2,
  status: "running",
  startedAt: new Date(),
  updatedAt: new Date(),
  error: undefined,
  ...overrides,
});
