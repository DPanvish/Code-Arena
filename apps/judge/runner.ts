// apps/judge/runner.ts
import { spawn } from 'child_process';
import * as path from 'path';

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

export const traceCode = (code: string, language: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const lang = language.toLowerCase();
    if (lang !== 'python' && lang !== 'javascript' && lang !== 'node') {
      return reject(new Error('Tracing currently only supported for Python and JavaScript.'));
    }

    let runnerProcess;
    if (lang === 'python') {
        const tracerPath = path.join(__dirname, 'tracer.py');
        runnerProcess = spawn('python', [tracerPath]);
    } else {
        const tracerPath = path.join(__dirname, 'js_tracer.js');
        runnerProcess = spawn('node', [tracerPath]);
    }

    let output = '';
    let errorOutput = '';

    runnerProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    runnerProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    runnerProcess.stdin.write(code);
    runnerProcess.stdin.end();

    const timeout = setTimeout(() => {
      runnerProcess.kill('SIGKILL');
      reject(new Error('TIME_LIMIT_EXCEEDED'));
    }, 5000); // 5 seconds for tracing since it's slower

    runnerProcess.on('close', (exitCode) => {
      clearTimeout(timeout); 

      if (exitCode !== 0) {
        return reject(new Error(errorOutput || 'RUNTIME_ERROR'));
      } 
      
      try {
        const snapshots = JSON.parse(output.trim());
        resolve(snapshots);
      } catch (e) {
        reject(new Error('Failed to parse tracer output'));
      }
    });
    
    runnerProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start tracer: ${err.message}`));
    });
  });
};
