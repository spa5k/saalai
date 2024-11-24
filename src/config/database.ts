import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { config } from "./config";

export const getConnectionString = () => {
  return config.mongodb.uri;
};

export const connectDatabase = async () => {
  try {
    const connectionString = getConnectionString();
    logger.info("Connecting to MongoDB", {
      env: process.env.NODE_ENV,
      isTest: process.env.NODE_ENV === "test",
    });

    await mongoose.connect(connectionString);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("MongoDB connection error:", { error });
    throw error;
  }
};
