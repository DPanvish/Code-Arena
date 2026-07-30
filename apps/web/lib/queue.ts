import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not set");
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  tls: { rejectUnauthorized: false },
  pingInterval: 10000,
  keepAlive: 10000,
  enableReadyCheck: false,
  family: 0,
});

export const submissionQueue = new Queue("submissions", { 
  connection: connection as any 
});