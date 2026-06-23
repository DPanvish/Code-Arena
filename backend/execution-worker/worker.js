import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import util from 'util';

const execFileAsync = util.promisify(execFile);
const LANGUAGE_EXTENSIONS = new Map([
  ['cpp', 'cpp'],
  ['py', 'py'],
  ['python', 'py'],
]);
const ENGINE_PATH = path.resolve('../execution-engine/engine');

const worker = new Worker('CodeSubmissions', async (job) => {
  const { code, language, problemId, userId } = job.data;
  
  const ext = LANGUAGE_EXTENSIONS.get(language);
  if (!ext) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const filename = `${uuidv4()}.${ext}`;
  const tempPath = path.join(__dirname, 'temp', filename);

  try {
    await fs.writeFile(tempPath, code);
    
    let stdout = '';
    let exitCode = 0;

    try {
      ({ stdout } = await execAsync(`${ENGINE_PATH} ${language} ${tempPath}`));
    } catch (error) {
      if (typeof error.code === 'number') {
        stdout = error.stdout || '';
        exitCode = error.code;
      } else {
        throw error;
      }
    }

    await fs.unlink(tempPath);

    const results = {
      stdout,
      status: exitCode === 0 ? 'Success' : 'Runtime Error'
    };
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