import { Queue } from "bullmq";
import IORedis from "ioredis";

// Establish the Redis connection
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // Required by BullMQ
});

// Instantiate the Submission Queue
export const submissionQueue = new Queue("submissions", { 
  connection: connection as any,
  defaultJobOptions: {
    removeOnComplete: true, // Keep Redis memory clean
    removeOnFail: false,    // Keep failed jobs for debugging
    attempts: 3,            // Retry temporary execution failures
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  }
});