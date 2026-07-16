import { spawn } from 'child_process';

export const runCodeInDocker = (code: string, language: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    
    if (language !== 'node') {
      return reject(new Error(`Language ${language} is not supported yet.`));
    }

    // The core Docker execution command enforcing all security limits
    const dockerProcess = spawn('docker', [
      'run', 
      '--rm',            // Instantly destroy the container after execution
      '-i',              // Interactive mode (keeps stdin open)
      '--network', 'none', // STRIKE 1: No network access
      '--memory', '256m',  // STRIKE 2: 256 MB RAM limit
      '--cpus', '0.5',     // Limit CPU usage
      'node:18-alpine',    // The execution image
      'node', '-'          // The '-' tells Node.js to read the code from stdin
    ]);

    let output = '';
    let errorOutput = '';

    // Capture standard output (console.logs)
    dockerProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Capture errors
    dockerProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Inject the user's code securely into the container
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

      if (exitCode !== 0) {
        // If exit code is not 0, the user's code threw an error
        reject(new Error(errorOutput || 'RUNTIME_ERROR'));
      } else {
        // Execution successful! Return the trimmed output
        resolve(output.trim());
      }
    });
  });
};