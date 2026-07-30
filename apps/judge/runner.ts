// apps/judge/runner.ts
import { spawn } from 'child_process';

const RUNTIMES: Record<string, { cmd: string; args: string[] }> = {
  node: { cmd: 'node', args: ['-'] },
  // Note: If you are on Mac/Linux, change 'python' to 'python3'
  python: { cmd: 'python', args: ['-'] }, 
};

export const runCodeInDocker = (code: string, language: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const runtime = RUNTIMES[language.toLowerCase()];
    
    if (!runtime) {
      return reject(new Error(`Language ${language} is not supported in local bare-metal mode.`));
    }

    const runnerProcess = spawn(runtime.cmd, runtime.args);

    let output = '';
    let errorOutput = '';

    runnerProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    runnerProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Inject the user's code into standard input
    runnerProcess.stdin.write(code);
    runnerProcess.stdin.end();

    // 2-Second Time Limit Enforcer
    const timeout = setTimeout(() => {
      runnerProcess.kill();
      reject(new Error('TIME_LIMIT_EXCEEDED'));
    }, 2000);

    // Wait for the process to finish
    runnerProcess.on('close', (exitCode) => {
      clearTimeout(timeout); 

      if (exitCode !== 0) {
        return reject(new Error(errorOutput || 'RUNTIME_ERROR'));
      } 
      
      resolve(output.trim());
    });
    
    runnerProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start process: ${err.message}. Do you have ${runtime.cmd} installed?`));
    });
  });
};