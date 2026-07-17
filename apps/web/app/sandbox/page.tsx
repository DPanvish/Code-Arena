"use client";

import { useState, useEffect } from "react";
import CodeEditor from "../../components/CodeEditor";

export default function SandboxPage() {
  const [problem, setProblem] = useState<any>(null);
  const [status, setStatus] = useState<string>("Initializing...");

  useEffect(() => {
    // Fetch the full problem object, not just the ID
    fetch('/api/problems?limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.problems && data.problems.length > 0) {
          setProblem(data.problems[0]);
          setStatus("Ready to code.");
        } else {
          setStatus("No problems found in database.");
        }
      });
  }, []);

  const handleSubmit = async (code: string) => {
    if (!problem) return;
    setStatus("Transmitting to Judge Worker...");

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          code,
          language: "node"
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-2xl font-extrabold">Arena Sandbox</h1>
        <div className="text-primary-cyan font-mono text-sm bg-[#121217] border border-white/10 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.1)]">
          {status}
        </div>
      </div>
      
      {/* Main Workspace Workspace */}
      <div className="flex-grow flex gap-6 overflow-hidden">
        
        {problem ? (
          <>
            {/* LEFT PANE: Problem Description */}
            <div className="w-1/3 h-full bg-[#121217] rounded-xl border border-white/10 p-6 overflow-y-auto shadow-clay-card flex flex-col custom-scrollbar">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">{problem.title}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                  problem.difficulty === 'EASY' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {problem.difficulty}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {problem.tags?.map((tag: string) => (
                  <span key={tag} className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="text-gray-300 leading-relaxed font-sans border-t border-white/5 pt-4">
                {problem.description}
              </div>
            </div>

            {/* RIGHT PANE: Code Editor */}
            <div className="w-2/3 h-full relative group">
              <CodeEditor
                problemId={problem.id}
                language="node"
                defaultCode={`// Press Ctrl + Enter to submit\nfunction twoSum(nums, target) {\n    // Write your logic here\n}\n`}
                onSubmit={handleSubmit}
                onRunSamples={() => setStatus("Local sample testing not yet wired up.")}
              />
            </div>
          </>
        ) : (
          <div className="w-full h-full border border-white/10 rounded-xl flex items-center justify-center text-gray-500 font-mono bg-[#121217]">
            Loading Arena Environment...
          </div>
        )}
      </div>
    </div>
  );
}