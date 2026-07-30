import { Queue } from "bullmq";
import IORedis from "ioredis";

// Use the EXACT same URL you used in your Judge Worker
const UPSTASH_URL = ;

// Use the EXACT same connection settings
const connection = new IORedis(UPSTASH_URL, {
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