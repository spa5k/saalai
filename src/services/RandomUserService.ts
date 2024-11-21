import axios from 'axios';
import { User } from '../models/User';
import { Config, IApiConfig } from '../models/Config';
import { Queue } from '../utils/Queue';
import { IItems } from '../types';
import { BatchProgress, IBatchProgress } from '../models/BatchProgress';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

export class RandomUserService {
  private queue: Queue;
  private requestCount: number = 0;
  private lastRequestTime: number = Date.now();
  private config: IApiConfig | null = null;
  private readonly BATCH_RETENTION_HOURS = 24; // Keep completed batches for 24 hours

  constructor() {
    this.queue = new Queue();
    this.cleanupOldBatches().catch(error => {
      logger.error('Error during initial batch cleanup', { error });
    });
  }

  private async cleanupOldBatches(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - this.BATCH_RETENTION_HOURS);

      // Clean up completed or failed batches older than retention period
      const result = await BatchProgress.deleteMany({
        $or: [
          { status: 'completed' },
          { status: 'failed' }
        ],
        updatedAt: { $lt: cutoffDate }
      });

      // Clean up stale running batches
      const staleResult = await BatchProgress.deleteMany({
        status: 'running',
        updatedAt: { $lt: cutoffDate }
      });

      logger.info('Batch cleanup completed', {
        completedBatchesRemoved: result.deletedCount,
        staleBatchesRemoved: staleResult.deletedCount
      });
    } catch (error) {
      logger.error('Error cleaning up old batches', { error });
    }
  }

  private async loadConfig(): Promise<IApiConfig> {
    if (this.config) return this.config;

    const config = await Config.findOne({ key: 'default' });
    if (!config) {
      // Create default config if not exists
      const defaultConfig = await Config.create({
        key: 'default',
        api: {
          randomUser: {
            baseUrl: 'https://randomuser.me/api/',
            requestsPerSecond: 5,
            sleepTime: 30000,
            batchSize: 300,
            batchSleep: 5000,
          },
        },
      });
      this.config = defaultConfig.api.randomUser;
    } else {
      this.config = config.api.randomUser;
    }

    return this.config;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async rateLimitedRequest(results: number): Promise<any> {
    const config = await this.loadConfig();
    const now = Date.now();
    
    if (this.requestCount >= config.requestsPerSecond) {
      if (now - this.lastRequestTime < 1000) {
        await this.sleep(1000 - (now - this.lastRequestTime));
      }
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }

    this.requestCount++;
    const response = await axios.get(`${config.baseUrl}?results=${results}`);
    return response.data;
  }

  public async fetchAndStoreUsers(totalUsers: number = 5000): Promise<IBatchProgress & { _id: Types.ObjectId }> {
    const config = await this.loadConfig();
    const batchSize = config.batchSize;
    const batches = Math.ceil(totalUsers / batchSize);
    
    logger.info('Starting new batch process', {
      totalUsers,
      batchSize,
      totalBatches: batches
    });

    const batchProgress = (await BatchProgress.create({
      totalBatches: batches,
      completedBatches: 0,
      pendingBatches: batches,
      status: 'running' as const,
      startedAt: new Date(),
    })) as IBatchProgress & { _id: Types.ObjectId };

    // Start background processing
    this.processBatches(batchProgress._id.toString(), totalUsers).catch(error => {
      logger.error('Error in background batch processing', { error });
    });

    return batchProgress;
  }

  private async processBatches(progressId: string, totalUsers: number): Promise<void> {
    const config = await this.loadConfig();
    const batchSize = config.batchSize;
    const batches = Math.ceil(totalUsers / batchSize);
    const startTime = Date.now();

    try {
      for (let i = 0; i < batches; i++) {
        const remainingUsers = totalUsers - (i * batchSize);
        const currentBatchSize = Math.min(batchSize, remainingUsers);

        logger.info('Processing batch', {
          batchNumber: i + 1,
          totalBatches: batches,
          batchSize: currentBatchSize,
          progressId
        });

        await this.queue.add(async () => {
          const batchStartTime = Date.now();
          const data = await this.rateLimitedRequest(currentBatchSize);
          const users = data.results.map(this.transformUserData);
          await User.insertMany(users);

          // Update progress
          await BatchProgress.findByIdAndUpdate(progressId, {
            $inc: { completedBatches: 1, pendingBatches: -1 },
            updatedAt: new Date(),
          });

          logger.info('Batch completed', {
            batchNumber: i + 1,
            totalBatches: batches,
            duration: Date.now() - batchStartTime,
            progressId
          });
        });

        if (i > 0 && i % config.requestsPerSecond === 0) {
          await this.sleep(config.sleepTime);
        }

        await this.sleep(config.batchSleep);
      }

      // Mark as completed
      await BatchProgress.findByIdAndUpdate(progressId, {
        status: 'completed',
        updatedAt: new Date(),
      });

      logger.info('All batches completed', {
        progressId,
        totalBatches: batches,
        totalDuration: Date.now() - startTime
      });

      // Schedule cleanup after completion
      setTimeout(async () => {
        await this.cleanupOldBatches();
      }, this.BATCH_RETENTION_HOURS * 60 * 60 * 1000);

    } catch (error) {
      // Mark as failed
      await BatchProgress.findByIdAndUpdate(progressId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      });

      logger.error('Batch processing failed', {
        progressId,
        error,
        totalBatches: batches,
        duration: Date.now() - startTime
      });

      throw error;
    }
  }

  public async getBatchProgress(progressId: string): Promise<(IBatchProgress & { _id: Types.ObjectId }) | null> {
    return BatchProgress.findById(progressId);
  }

  private transformUserData(userData: any): Partial<IItems> {
    return {
      gender: userData.gender,
      name: `${userData.name.first} ${userData.name.last}`,
      address: {
        city: userData.location.city,
        state: userData.location.state,
        country: userData.location.country,
        street: userData.location.street.name,
      },
      email: userData.email,
      age: userData.dob.age.toString(),
      picture: userData.picture.large,
    };
  }

  // Method to update configuration
  public async updateConfig(newConfig: Partial<IApiConfig>): Promise<void> {
    await Config.updateOne(
      { key: 'default' },
      { 
        $set: {
          'api.randomUser': { ...this.config, ...newConfig },
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    this.config = null; // Force reload of config
  }
} 