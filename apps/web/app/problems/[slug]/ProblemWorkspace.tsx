"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeEditor from "../../../components/CodeEditor";
import VisualizerPanel from "../../../components/VisualizerPanel";
import { TraceSnapshot } from "../../../types/tracer";

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

const SUPPORTED_LANGUAGES = [
  { id: "node", name: "Node.js (18.x)" },
  { id: "python", name: "Python (3.11)" },
  { id: "cpp", name: "C++ (GCC 13)" },
];

const defaultCodeMap: Record<string, string> = {
  node: "// Press Ctrl + Enter to submit\nfunction solution(a, b) {\n    return a * b;\n}\n",
  python: "# Press Ctrl + Enter to submit\ndef solution(a, b):\n    return a * b\n",
  cpp: "// Press Ctrl + Enter to submit\n#include <iostream>\n\nint main() {\n    int a, b;\n    std::cin >> a >> b;\n    std::cout << (a * b) << std::endl;\n    return 0;\n}\n",
};

export default function ProblemWorkspace({ problem }: ProblemWorkspaceProps) {
  // Add language state
  const [language, setLanguage] = useState<string>("node");
  const [status, setStatus] = useState<string>("Ready to solve.");
  const [verdictCode, setVerdictCode] = useState<"IDLE" | "PENDING" | "ACCEPTED" | "REJECTED">("IDLE");
  const [isVisualizerMode, setIsVisualizerMode] = useState(false);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [errorPin, setErrorPin] = useState<{ line: number, message: string } | null>(null);
  const [traceSnapshots, setTraceSnapshots] = useState<TraceSnapshot[]>([]);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
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
          language, 
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

  const handleTrace = async () => {
    // get current code from localstorage or use default
    const currentCode = localStorage.getItem(`codearena-${problem.id}-${language}`) || defaultCodeMap[language] || "";
    setStatus("Tracing execution...");
    setVerdictCode("PENDING");
    setIsVisualizerMode(true);
    setTraceSnapshots([]);
    setHighlightedLine(null);
    setErrorPin(null);

    try {
      const res = await fetch("/api/submissions/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          code: currentCode,
          language, 
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.snapshots) {
        setStatus(`Trace complete.`);
        setVerdictCode("ACCEPTED");
        setTraceSnapshots(data.snapshots);
      } else {
        setStatus(`Trace Error: ${data.error || "Failed"}`);
        setVerdictCode("REJECTED");
      }
    } catch (error) {
      console.error("Trace failed:", error);
      setStatus("Failed to trace code.");
      setVerdictCode("REJECTED");
    }
  };

  const startPolling = (submissionId: string) => {
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
          } else if (currentStatus === "WRONG_ANSWER" || currentStatus === "RUNTIME_ERROR" || currentStatus === "TIME_LIMIT_EXCEEDED" || currentStatus === "MEMORY_LIMIT_EXCEEDED") {
            setStatus(`❌ ${currentStatus.replace(/_/g, ' ')}`);
            setVerdictCode("REJECTED");
            clearInterval(pollInterval.current!);
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 500); 
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
        {/* Left Pane: Markdown Description OR Visualizer */}
        <div className={`transition-all duration-300 h-full bg-[#121217] rounded-xl border border-white/10 p-6 overflow-y-auto shadow-clay-card flex flex-col custom-scrollbar ${isVisualizerMode ? 'w-1/2' : 'w-1/3'}`}>
          <div className="flex items-center justify-between mb-4 shrink-0">
             <div className="flex gap-4 items-center">
               <button 
                 onClick={() => setIsVisualizerMode(false)}
                 className={`text-xl font-bold transition-colors ${!isVisualizerMode ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
               >
                 Description
               </button>
               <button 
                 onClick={() => setIsVisualizerMode(true)}
                 className={`text-xl font-bold flex items-center gap-2 transition-colors ${isVisualizerMode ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
               >
                 Visualizer
                 {isVisualizerMode && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>}
               </button>
             </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
              problem.difficulty === 'EASY' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
              'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {problem.difficulty}
            </span>
          </div>
          
          {!isVisualizerMode ? (
            <>
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
                p: ({...props}) => <p className="mb-4" {...props} />,
                strong: ({...props}) => <strong className="font-bold text-white" {...props} />,
                ul: ({...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                ol: ({...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                code: ({inline, ...props}: any) => 
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
          </>
          ) : (
            <VisualizerPanel 
               snapshots={traceSnapshots} 
               onLineChange={(line) => setHighlightedLine(line)} 
               onErrorPin={(err) => setErrorPin(err)}
            />
          )}
        </div>

        {/* Right Pane: Editor with Language Toolbar */}
        <div className={`transition-all duration-300 h-full flex flex-col bg-[#121217] rounded-xl overflow-hidden border border-white/10 shadow-clay-card ${isVisualizerMode ? 'w-1/2' : 'w-2/3'}`}>
          
          {/* 4. Language Selector Toolbar */}
          <div className="h-12 border-b border-white/10 bg-white/5 flex items-center px-4 justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-400">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-black/50 border border-white/10 text-primary-cyan text-sm rounded-md px-3 py-1 outline-none focus:border-primary-cyan/50 focus:ring-1 focus:ring-primary-cyan transition-all cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsDiffMode(!isDiffMode)}
                className={`px-4 py-1 rounded-lg border text-sm font-bold transition ${isDiffMode ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-orange-500/5 border-orange-500/20 text-orange-500 hover:bg-orange-500/10'}`}
                title="Compare your code against the original template"
              >
                Diff Mode
              </button>
              <button 
                onClick={handleTrace}
                disabled={language !== "python" && language !== "javascript"}
                className="px-4 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-bold hover:bg-indigo-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={language !== "python" && language !== "javascript" ? "Tracing is currently only supported for Python and JS" : "Trace execution line-by-line"}
              >
                Debug / Trace
              </button>
              <div className="text-xs text-gray-500 font-mono">
                Submit: Ctrl + Enter
              </div>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-grow relative">
            <CodeEditor
              key={language} // <--- ADD THIS LINE!
              problemId={problem.id}
              language={language === "node" ? "javascript" : language}
              defaultCode={defaultCodeMap[language] || ""}
              onSubmit={handleSubmit}
              onRunSamples={() => setStatus("Sample running coming later.")}
              highlightedLine={isVisualizerMode ? highlightedLine : null}
              isDiffMode={isDiffMode}
              diffOriginalCode={defaultCodeMap[language] || ""}
              errorPin={errorPin}
            />
          </div>
        </div>

      </div>
    </div>
  );
}