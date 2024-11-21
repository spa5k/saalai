import mongoose, { Schema, Document } from 'mongoose';

export interface IApiConfig {
  baseUrl: string;
  requestsPerSecond: number;
  sleepTime: number;
  batchSize: number;
  batchSleep: number;
}

export interface IConfig extends Document {
  key: string;
  api: {
    randomUser: IApiConfig;
  };
  updatedAt: Date;
}

const ApiConfigSchema = new Schema<IApiConfig>({
  baseUrl: { type: String, required: true },
  requestsPerSecond: { type: Number, required: true },
  sleepTime: { type: Number, required: true },
  batchSize: { type: Number, required: true },
  batchSleep: { type: Number, required: true },
});

const ConfigSchema = new Schema<IConfig>({
  key: { type: String, required: true, unique: true },
  api: {
    randomUser: ApiConfigSchema,
  },
  updatedAt: { type: Date, default: Date.now },
});

export const Config = mongoose.model<IConfig>('Config', ConfigSchema); 