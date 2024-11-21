import { logger } from "./logger";

export class Queue {
  private queue: (() => Promise<void>)[] = [];
  private processing: boolean = false;

  public async add(task: () => Promise<void>): Promise<void> {
    this.queue.push(task);
    if (!this.processing) {
      await this.process();
    }
  }

  private async process(): Promise<void> {
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
        logger.info("Processing task", {/* task details */});
      }
    }
    this.processing = false;
  }
}
