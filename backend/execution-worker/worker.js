import { Worker } from 'bullmq';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import util from 'util';

const execAsync = util.promisify(exec);
const ENGINE_PATH = path.resolve('../execution-engine/engine');

const worker = new Worker('CodeSubmissions', async (job) => {
  const { code, language, problemId, userId } = job.data;
  
  const ext = language === 'cpp' ? 'cpp' : 'py';
  const filename = `${uuidv4()}.${ext}`;
  const tempPath = path.join(__dirname, 'temp', filename);

  try {
    await fs.writeFile(tempPath, code);
    
    const { stdout, stderr } = await execAsync(`${ENGINE_PATH} ${language} ${tempPath}`);
    
    await fs.unlink(tempPath);

    const results = { stdout, stderr, status: stderr ? 'Runtime Error' : 'Success' };
    
    return results;

  } catch (error) {
    try { await fs.unlink(tempPath); } catch (e) {}
    throw new Error(`Sandboxed process compilation failure: ${error.message}`);
  }
}, {
  connection: new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null }),
  concurrency: 4 
});

worker.on('completed', (job, returnvalue) => {
  console.log(`Job ${job.id} finalized successfully execution.`);
});