// apps/worker/runner.ts (or wherever your runner is located)
import { spawn } from 'child_process';

export const runCodeInDocker = (code: string, language: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    
    if (language !== 'node') {
      return reject(new Error(`Language ${language} is not supported yet.`));
    }

    // The core Docker execution command enforcing ALL security limits
    const dockerProcess = spawn('docker', [
      'run', 
      '--rm',                  // Instantly destroy the container after execution
      '-i',                    // Interactive mode (keeps stdin open)
      '--network', 'none',     // 🚫 STRIKE 1: No network access
      '-m', '256m',            // 🛑 STRIKE 2: 256 MB RAM limit
      '--memory-swap', '256m', // 🛑 STRIKE 3: Disable swap to enforce hard memory limit
      '--cpus', '1',           // Limit CPU usage to 1 core
      '--pids-limit', '64',    // 🛡️ STRIKE 4: Prevent fork bombs (infinite processes)
      '--cap-drop', 'ALL',     // 🛡️ STRIKE 5: Drop all root privileges inside container
      'node:18-alpine',        // The lightweight execution image
      'node', '-'              // The '-' tells Node.js to read the code from stdin
    ]);

    let output = '';
    let errorOutput = '';
    // Prevent malicious output spam (1MB limit)
    const MAX_OUTPUT_SIZE = 1024 * 1024; 

    // Capture standard output
    dockerProcess.stdout.on('data', (data) => {
      if (output.length < MAX_OUTPUT_SIZE) {
        output += data.toString();
        if (output.length >= MAX_OUTPUT_SIZE) {
          dockerProcess.kill();
        }
      }
    });

    // Capture errors
    dockerProcess.stderr.on('data', (data) => {
      if (errorOutput.length < MAX_OUTPUT_SIZE) {
        errorOutput += data.toString();
      }
    });

    // Inject the user's code directly into the container's memory
    dockerProcess.stdin.write(code);
    dockerProcess.stdin.end();

    // 2-Second Time Limit (TLE) Enforcer
    const timeout = setTimeout(() => {
      dockerProcess.kill();
      reject(new Error('TIME_LIMIT_EXCEEDED'));
    }, 2000);

    // Wait for the container to finish
    dockerProcess.on('close', (exitCode) => {
      clearTimeout(timeout); // Clear the TLE timer

      // Exit code 137 is Docker's standard signal for "Out Of Memory" (OOM Killed)
      if (exitCode === 137) {
        return reject(new Error('MEMORY_LIMIT_EXCEEDED'));
      }

      if (exitCode !== 0) {
        // If exit code is not 0, the user's code threw an error
        return reject(new Error(errorOutput || 'RUNTIME_ERROR'));
      } 
      
      // Execution successful! Return the trimmed output
      resolve(output.trim());
    });
  });
};