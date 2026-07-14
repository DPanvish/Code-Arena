import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../../packages/db/index';

console.log("🚀 Judge Worker booting up...");

// Connect to the same Redis container we just spun up
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker('submissions', async (job) => {
  console.log(`\n📥 Received Submission ID: ${job.data.submissionId}`);
  console.log(`💻 Language: ${job.data.language}`);
  
  const { submissionId, code, language, testCases } = job.data;

  try {
    // Update DB to show we have begun processing
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "PENDING" } 
    });

    // TODO: Containerized Execution
    console.log(`⚙️ Executing code in isolated container...`);
    
    // Simulating the time it takes to run a Docker container for now
    await new Promise(resolve => setTimeout(resolve, 1500));

    //  Update DB with final verdict (Stubbed as ACCEPTED for testing)
    await prisma.submission.update({
      where: { id: submissionId },
      data: { 
        status: "ACCEPTED", 
        executionMs: Math.floor(Math.random() * 50) + 10, // Fake MS
        memoryKb: 2048 
      }
    });

    console.log(`✅ Submission ${submissionId} graded: ACCEPTED`);
    
  } catch (error) {
    console.error(`❌ Error grading ${submissionId}:`, error);
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "RUNTIME_ERROR" }
    });
  }
}, { connection: connection as any });

worker.on('ready', () => {
  console.log("🎧 Judge Worker listening for jobs on Redis...");
});