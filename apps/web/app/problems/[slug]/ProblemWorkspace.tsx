"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  const [verdictCode, setVerdictCode] = useState<"IDLE" | "PENDING" | "ACCEPTED" | "REJECTED">("IDLE");
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (code: string) => {
    setStatus("Transmitting to Judge Worker...");
    setVerdictCode("PENDING");

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
        setStatus(`Enqueued! Grading in progress...`);
        startPolling(data.submissionId);
      } else {
        setStatus(`Error: ${data.message}`);
        setVerdictCode("REJECTED");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      setStatus("Failed to connect to the Judge API.");
      setVerdictCode("REJECTED");
    }
  };

  const startPolling = (submissionId: string) => {
    // Clear any existing intervals just in case
    if (pollInterval.current) clearInterval(pollInterval.current);

    pollInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/submissions/${submissionId}`);
        const data = await res.json();

        if (data.submission) {
          const { status: currentStatus, executionMs } = data.submission;

          if (currentStatus === "ACCEPTED") {
            setStatus(`🏆 ACCEPTED in ${executionMs}ms!`);
            setVerdictCode("ACCEPTED");
            clearInterval(pollInterval.current!);
          } else if (currentStatus === "WRONG_ANSWER" || currentStatus === "RUNTIME_ERROR" || currentStatus === "TIME_LIMIT_EXCEEDED") {
            setStatus(`❌ ${currentStatus.replace(/_/g, ' ')}`);
            setVerdictCode("REJECTED");
            clearInterval(pollInterval.current!);
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 500); // Ping every 500ms
  };

  const statusColors = {
    IDLE: "text-gray-400 bg-[#121217] border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]",
    PENDING: "text-primary-cyan bg-[#121217] border-primary-cyan/30 shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-pulse",
    ACCEPTED: "text-green-400 bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]",
    REJECTED: "text-red-400 bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-white text-2xl font-extrabold flex items-center gap-4">
          <span className="text-gray-600">Arena /</span>
          {problem.title}
        </h1>
        {/* Dynamic Status Bar */}
        <div className={`font-mono text-sm px-4 py-2 rounded-lg border transition-all duration-300 ${statusColors[verdictCode]}`}>
          {status}
        </div>
      </div>

      <div className="flex-grow flex gap-6 overflow-hidden min-h-0">
        <div className="w-1/3 h-full bg-[#121217] rounded-xl border border-white/10 p-6 overflow-y-auto shadow-clay-card flex flex-col custom-scrollbar">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-2xl font-bold text-white">{problem.title}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
              problem.difficulty === 'EASY' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
              'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {problem.difficulty}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-6 shrink-0">
            {problem.tags?.map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded-md">
                {tag}
              </span>
            ))}
          </div>

          <div className="text-gray-300 leading-relaxed font-sans pt-2">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, ...props}) => <p className="mb-4" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                code: ({node, inline, ...props}: any) => 
                  inline ? (
                    <code className="px-1.5 py-0.5 bg-white/10 text-primary-cyan rounded font-mono text-sm" {...props} />
                  ) : (
                    <code className="block bg-black/50 border border-white/10 p-4 rounded-lg font-mono text-sm my-4 overflow-x-auto text-primary-cyan custom-scrollbar" {...props} />
                  )
              }}
            >
              {problem.description || "No description provided."}
            </ReactMarkdown>
          </div>
        </div>

        <div className="w-2/3 h-full relative group rounded-xl overflow-hidden border border-white/10 shadow-clay-card">
          <CodeEditor
            problemId={problem.id}
            language="node"
            defaultCode={`// Press Ctrl + Enter to submit\nfunction solution(inputs) {\n    // Write your logic here\n}\n`}
            onSubmit={handleSubmit}
            onRunSamples={() => setStatus("Sample running coming later.")}
          />
        </div>
      </div>
    </div>
  );
}