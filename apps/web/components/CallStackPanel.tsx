import { StackFrame } from "../types/tracer";

interface CallStackPanelProps {
  stack: StackFrame[];
}

export default function CallStackPanel({ stack }: CallStackPanelProps) {
  return (
    <div className="bg-[#121217] rounded-xl border border-white/10 shadow-clay-card flex flex-col h-full overflow-hidden">
      <div className="bg-white/5 border-b border-white/10 px-4 py-3 shrink-0">
        <h3 className="text-white font-bold text-sm tracking-wide uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Call Stack
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {stack.length === 0 ? (
          <div className="text-gray-500 text-sm italic text-center mt-4">
            Stack is empty.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {stack.map((frame, idx) => (
              <li 
                key={idx} 
                className={`px-3 py-2 rounded-lg font-mono text-sm border flex justify-between items-center ${
                  idx === 0 
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" // Top of stack is highlighted
                    : "bg-white/5 border-white/10 text-gray-400"
                }`}
              >
                <span className="truncate pr-2">{frame.function}()</span>
                <span className="text-xs opacity-70 shrink-0">Ln {frame.line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
