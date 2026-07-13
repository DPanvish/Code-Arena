"use client";

import { useState, useEffect } from "react";
import CodeEditor from "../../components/CodeEditor";

export default function SandboxPage() {
  const [problemId, setProblemId] = useState<string>("");
  const [status, setStatus] = useState<string>("Initializing...");

  useEffect(() => {
    // Fetch the ID of the problem we created in Phase 1.3
    fetch('/api/problems?limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.problems && data.problems.length > 0) {
          setProblemId(data.problems[0].id);
          setStatus("Ready to code.");
        } else {
          setStatus("No problems found in database.");
        }
      });
  }, []);

  const handleSubmit = async (code: string) => {
    if (!problemId) return;
    setStatus("Transmitting to Judge Worker...");

    try {
      // Send the code to our Next.js API
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          code,
          language: "node" // Hardcoded to Node.js for this test
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setStatus(`Enqueued! Submission ID: ${data.submissionId}`);
      } else {
        setStatus(`Error: ${data.message}`);
      }
    } catch (error) {
      setStatus("Failed to reach server.");
    }
  };

  return (
    <div className="h-screen pt-24 px-8 pb-8 flex flex-col bg-[#09090b]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-white text-2xl font-extrabold">Arena Sandbox</h1>
        <div className="text-primary-cyan font-mono text-sm bg-white/5 px-4 py-2 rounded-lg">
          {status}
        </div>
      </div>
      
      <div className="flex-grow">
        {problemId ? (
          <CodeEditor
            problemId={problemId}
            language="node"
            defaultCode={"// Press Ctrl + Enter to submit\nconsole.log('Hello from the CodeArena Judge!');"}
            onSubmit={handleSubmit}
            onRunSamples={(code) => setStatus("Local sample testing not yet wired up.")}
          />
        ) : (
          <div className="w-full h-full border border-white/10 rounded-xl flex items-center justify-center text-gray-500 font-mono">
            Loading Arena Environment...
          </div>
        )}
      </div>
    </div>
  );
}