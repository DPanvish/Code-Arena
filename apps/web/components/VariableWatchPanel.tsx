import { VariableState } from "../../types/tracer";

interface VariableWatchPanelProps {
  variables: Record<string, VariableState>;
}

export default function VariableWatchPanel({ variables }: VariableWatchPanelProps) {
  const variableNames = Object.keys(variables);

  return (
    <div className="bg-[#121217] rounded-xl border border-white/10 shadow-clay-card flex flex-col h-full overflow-hidden">
      <div className="bg-white/5 border-b border-white/10 px-4 py-3 shrink-0">
        <h3 className="text-white font-bold text-sm tracking-wide uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-cyan animate-pulse"></span>
          Variable Watch
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {variableNames.length === 0 ? (
          <div className="text-gray-500 text-sm italic text-center mt-4">
            No local variables in scope.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-500">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {variableNames.map((name) => (
                <tr key={name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-2 text-primary-cyan font-mono">{name}</td>
                  <td className="py-2 text-yellow-400 font-mono text-xs">{variables[name].type}</td>
                  <td className="py-2 text-green-400 font-mono">{variables[name].value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
