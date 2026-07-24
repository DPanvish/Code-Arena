"use client";

import { useState } from "react";
import CodeEditor from "../../../components/CodeEditor";


interface ProblemWorkspaceProps {
  problem: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    difficulty: string;
    tags: string[];
  };
}

export default function ProblemWorkspace({ problem }: ProblemWorkspaceProps) {
  const [status, setStatus] = useState<string>("Ready to solve.");

  const handleSubmit = async (code: string) => {
    setStatus("Transmitting to Judge Worker...");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          code,
          language: "node", 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(`Enqueued! Submission ID: ${data.submissionId.slice(-8)}`);
        // TODO: Later, we will use WebSockets here to listen for the live verdict
      } else {
        setStatus(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      setStatus("Failed to connect to the Judge API.");
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-2xl font-extrabold flex items-center gap-4">
          <span className="text-gray-600">Arena /</span>
          {problem.title}
        </h1>
        <div className="text-primary-cyan font-mono text-sm bg-[#121217] border border-white/10 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.1)]">
          {status}
        </div>
      </div>

      {/* Main Workspace (Description left, Editor right) */}
      <div className="flex-grow flex gap-6 overflow-hidden">
        
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
          
          <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-6">
            {problem.tags?.map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded-md">
                {tag}
              </span>
            ))}
          </div>

          {/* Render the description, respecting \n line breaks */}
          <div className="text-gray-300 leading-relaxed font-sans pt-2 whitespace-pre-wrap">
            {problem.description || "No description provided."}
          </div>
        </div>

        {/* RIGHT PANE: Monaco Editor */}
        <div className="w-2/3 h-full relative group">
          <CodeEditor
            problemId={problem.id}
            language="node"
            // Start with a generic placeholder for now
            defaultCode={`// Press Ctrl + Enter to submit\nfunction solution(inputs) {\n    // Write your logic here\n}\n`}
            onSubmit={handleSubmit}
            onRunSamples={() => setStatus("Sample running coming later in Phase 4.")}
          />
        </div>
      </div>
    </>
  );
}