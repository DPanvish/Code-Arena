"use client";

import { useState, useEffect } from "react";
import { TraceSnapshot } from "../types/tracer";
import VariableWatchPanel from "./VariableWatchPanel";
import CallStackPanel from "./CallStackPanel";

interface VisualizerPanelProps {
  snapshots: TraceSnapshot[];
  onLineChange?: (line: number) => void;
}

export default function VisualizerPanel({ snapshots, onLineChange }: VisualizerPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const snapshot = snapshots[currentStep];

  useEffect(() => {
    if (snapshot && onLineChange) {
      onLineChange(snapshot.line);
    }
  }, [currentStep, snapshot, onLineChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStep < snapshots.length - 1) {
      interval = setInterval(() => {
        setCurrentStep(prev => prev + 1);
      }, 700); // 700ms per step
    } else if (currentStep >= snapshots.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, snapshots.length]);

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#121217] rounded-xl border border-white/10 text-gray-500 shadow-clay-card">
        Run code in Trace Mode to see the visualizer.
      </div>
    );
  }

  const handleNext = () => setCurrentStep(prev => Math.min(snapshots.length - 1, prev + 1));
  const handlePrev = () => setCurrentStep(prev => Math.max(0, prev - 1));
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* VCR Controls */}
      <div className="flex items-center justify-between bg-[#121217] rounded-xl border border-white/10 px-6 py-4 shadow-clay-card shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={handleReset} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
          <button onClick={handlePrev} disabled={currentStep === 0} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition disabled:opacity-50">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className="px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-[0_0_15px_rgba(79,70,229,0.4)]"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button onClick={handleNext} disabled={currentStep === snapshots.length - 1} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition disabled:opacity-50">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </button>
        </div>
        
        <div className="text-sm font-mono text-gray-400 bg-black/50 px-4 py-1.5 rounded-lg border border-white/5">
          Step {currentStep + 1} / {snapshots.length}
        </div>
      </div>

      {/* Panels */}
      <div className="flex flex-col gap-4 min-h-0 flex-1">
        <div className="w-full h-1/2">
          <VariableWatchPanel variables={snapshot?.variables || {}} />
        </div>
        <div className="w-full h-1/2">
          <CallStackPanel stack={snapshot?.stack || []} />
        </div>
      </div>
    </div>
  );
}
