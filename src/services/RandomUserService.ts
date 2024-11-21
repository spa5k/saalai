import axios from 'axios';
import { User } from '../models/User';
import { Config, IApiConfig } from '../models/Config';
import { Queue } from '../utils/Queue';
import { IItems } from '../types';

export class RandomUserService {
  private queue: Queue;
  private requestCount: number = 0;
  private lastRequestTime: number = Date.now();
  private config: IApiConfig | null = null;

  constructor() {
    this.queue = new Queue();
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

  public async fetchAndStoreUsers(totalUsers: number = 5000): Promise<void> {
    const config = await this.loadConfig();
    const batchSize = config.batchSize;
    const batches = Math.ceil(totalUsers / batchSize);

    for (let i = 0; i < batches; i++) {
      const remainingUsers = totalUsers - (i * batchSize);
      const currentBatchSize = Math.min(batchSize, remainingUsers);

      await this.queue.add(async () => {
        const data = await this.rateLimitedRequest(currentBatchSize);
        const users = data.results.map(this.transformUserData);
        await User.insertMany(users);
      });

      if (i > 0 && i % config.requestsPerSecond === 0) {
        await this.sleep(config.sleepTime);
      }

      await this.sleep(config.batchSleep);
    }
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