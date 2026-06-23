import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null
});

export const codeSubmissionQueue = new Queue('CodeSubmissions', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: { 
        age: 3600, 
        count: 1000 
    },
    removeOnFail: { 
        age: 86400, 
        count: 1000 
    }
  }
});