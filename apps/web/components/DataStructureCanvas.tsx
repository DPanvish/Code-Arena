import { VariableState } from "../types/tracer";

interface DataStructureCanvasProps {
  variables: Record<string, VariableState>;
}

export default function DataStructureCanvas({ variables }: DataStructureCanvasProps) {
  // Find the first list variable to visualize (for MVP)
  const listVar = Object.entries(variables).find(([_, v]) => v.type === "list");

  let parsedArray: any[] | null = null;
  let varName = "";

  if (listVar) {
    varName = listVar[0];
    try {
      // Very naive python list string parser for MVP (assumes simple types like ints, strings)
      // e.g. "[1, 2, 3]"
      const valStr = listVar[1].value; 
      parsedArray = JSON.parse(valStr);
    } catch (e) {
      // Could not parse
    }
  }

  return (
    <div className="bg-[#121217] rounded-xl border border-white/10 shadow-clay-card flex flex-col h-full overflow-hidden">
      <div className="bg-white/5 border-b border-white/10 px-4 py-3 shrink-0 flex items-center justify-between">
        <h3 className="text-white font-bold text-sm tracking-wide uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
          Data Structure Canvas
        </h3>
        {varName && <span className="text-xs text-pink-400 font-mono bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">{varName} (Array)</span>}
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar p-6 flex items-center justify-center bg-black/20 relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        {parsedArray === null ? (
          <div className="text-gray-500 text-sm italic text-center relative z-10">
            No array structures in scope to visualize.
          </div>
        ) : parsedArray.length === 0 ? (
          <div className="text-gray-400 text-sm font-mono text-center relative z-10 border border-white/10 border-dashed rounded-xl px-8 py-4 bg-black/20 shadow-lg">
            [ ] (Empty Array)
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 items-center justify-center relative z-10">
            {Array.isArray(parsedArray) && parsedArray.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 group">
                <div className="text-[10px] text-gray-500 font-mono opacity-50 group-hover:opacity-100 transition-opacity">{idx}</div>
                <div className="w-14 h-14 flex items-center justify-center bg-[#1a1a24] border border-white/10 rounded-xl text-primary-cyan font-bold font-mono shadow-lg hover:border-primary-cyan/50 hover:bg-primary-cyan/10 transition-all hover:-translate-y-1">
                  {String(item)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
