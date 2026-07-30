
// Piston API mapping for languages
const PISTON_LANGUAGES: Record<string, { language: string; version: string }> = {
  node: { language: 'javascript', version: '18.15.0' },
  python: { language: 'python', version: '3.10.0' },
  cpp: { language: 'c++', version: '10.2.0' },
};

export const runCodeInDocker = async (code: string, language: string): Promise<string> => {
  const runtime = PISTON_LANGUAGES[language.toLowerCase()];
  
  if (!runtime) {
    throw new Error(`Language ${language} is not supported yet.`);
  }

  // We make a request to the free public Piston Execution Engine
  const response = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language: runtime.language,
      version: runtime.version,
      files: [
        {
          name: `main.${language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'js'}`,
          content: code,
        }
      ],
      // Piston handles our timeouts and memory limits on their servers!
      compile_timeout: 10000,
      run_timeout: 3000,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'RUNTIME_ERROR');
  }

  // Piston returns both stdout and stderr
  if (data.run.stderr) {
    throw new Error(data.run.stderr);
  }
  
  // If exit code is 137, they ran out of memory on Piston's servers
  if (data.run.code === 137) {
    throw new Error('MEMORY_LIMIT_EXCEEDED');
  }

  // If the run killed itself due to timeout
  if (data.run.signal === 'SIGKILL') {
    throw new Error('TIME_LIMIT_EXCEEDED');
  }

  return data.run.stdout.trim();
};