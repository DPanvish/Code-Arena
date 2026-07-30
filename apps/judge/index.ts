import "dotenv/config";
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@codearena/db';
import { runCodeInDocker } from './runner';

console.log("🚀 Judge Worker booting up...");

const connection = new IORedis(process.env.REDIS_URL  , {
  maxRetriesPerRequest: null,
  
  // Force TLS for secure Upstash connection
  tls: { rejectUnauthorized: false },
  
  // Prevent ECONNRESET by pinging Upstash every 10 seconds
  pingInterval: 10000,
  
  // Keep the TCP connection alive
  keepAlive: 10000,
  
  // Upstash compatibility settings
  enableReadyCheck: false,
  family: 0,
});

const worker = new Worker('submissions', async (job) => {
  console.log(`\n📥 Processing Submission: ${job.data.submissionId}`);
  
  const { submissionId, code, language, testCases } = job.data;

  try {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "PENDING" }
    });

    // Parse the test cases from the database
    // Expected format: [{ input: "2, 3", expected: "6" }]
    const parsedTestCases = typeof testCases === 'string' ? JSON.parse(testCases) : testCases;
    
    if (!parsedTestCases || !Array.isArray(parsedTestCases) || parsedTestCases.length === 0) {
      throw new Error("No test cases found for this problem.");
    }

    let allPassed = true;
    let maxExecutionMs = 0;

    console.log(`⚙️ Running ${parsedTestCases.length} test cases for language: ${language}...`);

    for (let i = 0; i < parsedTestCases.length; i++) {
      const tc = parsedTestCases[i];
      let wrapperCode = "";

      // THE MAGIC: Inject language-specific execution wrappers
      switch (language.toLowerCase()) {
        case "node":
          wrapperCode = `
            ${code}
            
            // --- ARENA JUDGE WRAPPER ---
            try {
              const result = solution(${tc.input});
              console.log(JSON.stringify(result));
            } catch(e) {
              console.error("Runtime Error:", e.message);
              process.exit(1); // Force non-zero exit so Docker knows it crashed
            }
          `;
          break;

        case "python":
          wrapperCode = `
import json
import sys

${code}

# --- ARENA JUDGE WRAPPER ---
if __name__ == "__main__":
    try:
        result = solution(${tc.input})
        print(json.dumps(result))
    except Exception as e:
        print(f"Runtime Error: {e}", file=sys.stderr)
        sys.exit(1)
          `;
          break;

        case "cpp":
          // C++ runs standard Codeforces style (user writes int main)
          // No wrapper injected; we run their raw code directly.
          wrapperCode = code; 
          break;

        default:
          throw new Error(`Wrapper not implemented for language: ${language}`);
      }

      const startTime = Date.now();
      const output = await runCodeInDocker(wrapperCode, language);
      const executionMs = Date.now() - startTime;
      
      maxExecutionMs = Math.max(maxExecutionMs, executionMs);

      // Clean string formatting to ensure strict comparison
      const cleanOutput = output.trim();
      const cleanExpected = String(tc.expected).trim();

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
    
    // Catch specific resource abuse errors from our Docker runner
    const finalStatus = 
        error.message === 'TIME_LIMIT_EXCEEDED' ? 'TIME_LIMIT_EXCEEDED' : 
        error.message === 'MEMORY_LIMIT_EXCEEDED' ? 'MEMORY_LIMIT_EXCEEDED' : 
        'RUNTIME_ERROR';

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: finalStatus }
    });
  }
}, { connection: connection as any });

worker.on('ready', () => {
  console.log("🎧 Polyglot Judge Worker listening for jobs on Redis...");
});