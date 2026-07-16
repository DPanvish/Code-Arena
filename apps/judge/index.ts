import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@codearena/db';
import { runCodeInDocker } from './runner'; 

console.log("🚀 Judge Worker booting up...");

const connection = new IORedis("redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker('submissions', async (job) => {
  console.log(`\n📥 Processing Submission: ${job.data.submissionId}`);
  
  const { submissionId, code, language, testCases } = job.data;

  try {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "PENDING" }
    });

    console.log(`⚙️ Booting Docker sandbox for ${language}...`);
    
    // EXECUTE THE CODE IN DOCKER
    const startTime = Date.now();
    const output = await runCodeInDocker(code, language);
    const executionMs = Date.now() - startTime;

    console.log(`📦 Output from container:`, output);
    
    // For now, if it ran without crashing, we mark it Accepted
    await prisma.submission.update({
      where: { id: submissionId },
      data: { 
        status: "ACCEPTED", 
        executionMs,
        memoryKb: 0
      }
    });

    console.log(`✅ Submission ${submissionId} graded: ACCEPTED in ${executionMs}ms`);
    
  } catch (error: any) {
    console.error(`❌ Error grading ${submissionId}:`, error.message);
    
    // Determine if it was our 2-second timeout or a code crash
    const finalStatus = error.message === 'TIME_LIMIT_EXCEEDED' 
      ? 'TIME_LIMIT_EXCEEDED' 
      : 'RUNTIME_ERROR';

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: finalStatus }
    });
  }
}, { connection: connection as any });

worker.on('ready', () => {
  console.log("🎧 Judge Worker listening for jobs on Redis...");
});