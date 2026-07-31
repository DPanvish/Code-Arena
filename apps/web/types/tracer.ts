export interface VariableState {
  type: string;
  value: string;
}

export interface StackFrame {
  function: string;
  line: number;
}

export interface TraceSnapshot {
  line: number;
  variables: Record<string, VariableState>;
  stack: StackFrame[];
  error?: string;
}
