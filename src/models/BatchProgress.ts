import mongoose, { Document, Schema } from "mongoose";

export interface IBatchProgress extends Document {
  totalBatches: number;
  completedBatches: number;
  pendingBatches: number;
  status: "running" | "completed" | "failed";
  error?: string;
  startedAt: Date;
  updatedAt: Date;
}

const BatchProgressSchema = new Schema<IBatchProgress>({
  totalBatches: { type: Number, required: true },
  completedBatches: { type: Number, required: true, default: 0 },
  pendingBatches: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ["running", "completed", "failed"],
    default: "running",
  },
  error: { type: String },
  startedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const BatchProgress = mongoose.model<IBatchProgress>("BatchProgress", BatchProgressSchema);
