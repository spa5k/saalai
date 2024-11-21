import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Queue } from '../Queue';
import { logger } from '../../utils/logger';

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Queue', () => {
  let queue: Queue;

  beforeEach(() => {
    queue = new Queue();
    vi.clearAllMocks();
  });

  describe('Batch Processing', () => {
    it('should process batches in sequence', async () => {
      const results: number[] = [];
      const batchSize = 3;
      const totalBatches = 3;

      // Create batches of tasks
      for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const batchTasks = Array.from({ length: batchSize }, (_, i) => {
          const taskNum = batchNum * batchSize + i;
          return async () => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
            results.push(taskNum);
          };
        });

        // Add batch to queue
        await Promise.all(batchTasks.map(task => queue.add(task)));
      }

      // Wait for all tasks to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify results are in sequence within batches
      expect(results).toHaveLength(totalBatches * batchSize);
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i]).toBeLessThan(results[i + 1]);
      }
    });

    it('should maintain batch order under load', async () => {
      const results: number[] = [];
      const batchCount = 5;
      const batchSize = 10;
      const batches = Array.from({ length: batchCount }, (_, batchIndex) =>
        Array.from({ length: batchSize }, (_, taskIndex) => {
          const taskNum = batchIndex * batchSize + taskIndex;
          return async () => {
            await new Promise(resolve => 
              setTimeout(resolve, Math.random() * 20)
            );
            results.push(taskNum);
          };
        })
      );

      // Add all batches concurrently
      await Promise.all(
        batches.flatMap(batch => 
          batch.map(task => queue.add(task))
        )
      );

      // Wait for all tasks to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify batch order
      expect(results).toHaveLength(batchCount * batchSize);
      const firstTaskOfEachBatch = results.filter((_, i) => i % batchSize === 0);
      expect(firstTaskOfEachBatch).toEqual([...firstTaskOfEachBatch].sort((a, b) => a - b));
    });

    it('should log batch processing events', async () => {
      const task = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      };

      // Wait for the task to complete, not just to be added
      await queue.add(task);
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing task'),
        expect.any(Object)
      );
    });
  });
}); 