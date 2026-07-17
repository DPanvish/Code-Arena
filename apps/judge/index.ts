import "dotenv/config";
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@codearena/db';
import { runCodeInDocker } from './runner';

console.log("🚀 Judge Worker booting up...");

const connection = new IORedis("redis://localhost:6379", { maxRetriesPerRequest: null });

const worker = new Worker('submissions', async (job) => {
  console.log(`\n📥 Processing Submission: ${job.data.submissionId}`);
  
  const { submissionId, code, language, testCases } = job.data;

  try {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "PENDING" }
    });

    // Parse the test cases from the database
    // Expected format: [{ input: "[2,7,11,15], 9", expected: "[0,1]" }]
    const parsedTestCases = typeof testCases === 'string' ? JSON.parse(testCases) : testCases;
    
    if (!parsedTestCases || !Array.isArray(parsedTestCases) || parsedTestCases.length === 0) {
      throw new Error("No test cases found for this problem.");
    }

    let allPassed = true;
    let maxExecutionMs = 0;

    console.log(`⚙️ Running ${parsedTestCases.length} test cases...`);

    for (let i = 0; i < parsedTestCases.length; i++) {
      const tc = parsedTestCases[i];

      // THE MAGIC: We append a hidden execution block to the user's code.
      // This calls their function with the test case inputs and prints the result as JSON.
      // (Note: We assume the function is named 'twoSum' for our current testing).
      const wrapperCode = `
        ${code}

        // --- ARENA JUDGE WRAPPER ---
        try {
          const result = twoSum(${tc.input});
          console.log(JSON.stringify(result));
        } catch(e) {
          console.error(e.message);
        }
      `;

      const startTime = Date.now();
      const output = await runCodeInDocker(wrapperCode, language);
      const executionMs = Date.now() - startTime;
      
      maxExecutionMs = Math.max(maxExecutionMs, executionMs);

      // Clean string formatting to ensure strict comparison
      const cleanOutput = output.trim();
      const cleanExpected = tc.expected.trim();

      if (cleanOutput !== cleanExpected) {
        allPassed = false;
        console.log(`❌ Test Case ${i + 1} Failed.\n   Expected: ${cleanExpected}\n   Got:      ${cleanOutput}`);
        
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "WRONG_ANSWER", executionMs: maxExecutionMs }
        });
        break; // Stop grading after the first failure
      }
      
      console.log(`✅ Test Case ${i + 1} Passed!`);
    }

    // If the loop finished and allPassed is still true, they beat the problem!
    if (allPassed) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { 
          status: "ACCEPTED", 
          executionMs: maxExecutionMs,
          memoryKb: 0 
        }
      });
      console.log(`🏆 Submission ${submissionId} completely graded: ACCEPTED in ${maxExecutionMs}ms`);
    }

  } catch (error: any) {
    console.error(`💥 System Error grading ${submissionId}:`, error.message);
    
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