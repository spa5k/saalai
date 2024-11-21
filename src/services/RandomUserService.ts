import axios from 'axios';
import { config } from '../config/config';
import { User } from '../models/User';
import { Queue } from '../utils/Queue';
import { IItems } from '../types';

export class RandomUserService {
  private queue: Queue;
  private requestCount: number = 0;
  private lastRequestTime: number = Date.now();

  constructor() {
    this.queue = new Queue();
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async rateLimitedRequest(results: number): Promise<any> {
    const now = Date.now();
    if (this.requestCount >= config.api.randomUser.requestsPerSecond) {
      if (now - this.lastRequestTime < 1000) {
        await this.sleep(1000 - (now - this.lastRequestTime));
      }
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }

    this.requestCount++;
    const response = await axios.get(`${config.api.randomUser.baseUrl}?results=${results}`);
    return response.data;
  }

  public async fetchAndStoreUsers(totalUsers: number = 5000): Promise<void> {
    const batchSize = config.api.randomUser.batchSize;
    const batches = Math.ceil(totalUsers / batchSize);

    for (let i = 0; i < batches; i++) {
      const remainingUsers = totalUsers - (i * batchSize);
      const currentBatchSize = Math.min(batchSize, remainingUsers);

      await this.queue.add(async () => {
        const data = await this.rateLimitedRequest(currentBatchSize);
        const users = data.results.map(this.transformUserData);
        await User.insertMany(users);
      });

      if (i > 0 && i % config.api.randomUser.requestsPerSecond === 0) {
        await this.sleep(config.api.randomUser.sleepTime);
      }

      await this.sleep(config.api.randomUser.batchSleep);
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
} 