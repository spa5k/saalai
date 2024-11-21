import { RandomUserService } from './RandomUserService';
import { logger } from '../utils/logger';
import { User } from '../models/User';

export class CronService {
  private randomUserService: RandomUserService;
  private interval: Timer | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.randomUserService = new RandomUserService();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Schedule daily job (24 hours in milliseconds)
    this.interval = setInterval(async () => {
      try {
        logger.info('Starting scheduled user fetch');
        await this.randomUserService.fetchAndStoreUsers(5000);
        logger.info('Completed scheduled user fetch');
      } catch (error) {
        logger.error('Error in scheduled user fetch', { error });
      }
    }, 24 * 60 * 60 * 1000);

    // Run immediately on startup if no users exist
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        logger.info('No users found, starting initial fetch');
        await this.randomUserService.fetchAndStoreUsers(5000);
      }
    } catch (error) {
      logger.error('Error checking initial user count', { error });
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
  }
} 