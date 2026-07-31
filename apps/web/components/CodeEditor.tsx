"use client";

import { useState, useEffect, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

interface CodeEditorProps {
  problemId: string;
  language: string;
  defaultCode: string;
  onSubmit: (code: string) => void;
  onRunSamples?: () => void;
  highlightedLine?: number | null;
}

export default function CodeEditor(props: CodeEditorProps) {
  const { 
    problemId, 
    language, 
    defaultCode, 
    onSubmit, 
    onRunSamples 
  } = props;
  
  const storageKey = `codearena-${problemId}-${language}`;
  const [code, setCode] = useState<string>("");
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<any>(null);

  useEffect(() => {
    const cachedCode = localStorage.getItem(storageKey);
    if (cachedCode) {
      setCode(cachedCode);
    } else {
      setCode(defaultCode);
    }
  }, [problemId, language, defaultCode, storageKey]);

  const handleEditorChange = (value: string | undefined) => {
    const val = value || "";
    setCode(val);
    localStorage.setItem(storageKey, val);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    decorationsRef.current = editor.createDecorationsCollection([]);

    // Ctrl/Cmd + Enter -> Submit Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      // We grab the value directly from the editor instance to prevent stale React closures
      const currentCode = editor.getValue();
      onSubmit(currentCode);
    });

    // Ctrl/Cmd + Shift + R -> Run Sample Tests
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyR, () => {
      if (onRunSamples) {
        onRunSamples();
      }
    });
  };

  useEffect(() => {
    if (decorationsRef.current && monacoRef.current) {
      if (props.highlightedLine) {
        decorationsRef.current.set([{
          range: new monacoRef.current.Range(props.highlightedLine, 1, props.highlightedLine, 1),
          options: {
            isWholeLine: true,
            className: 'bg-indigo-500/30',
          }
        }]);
      } else {
        decorationsRef.current.set([]);
      }
    }
  }, [props.highlightedLine]);

  return (
    <div className="w-full h-full absolute inset-0">
      <Editor
        height="100%"
        language={language}
        theme="vs-dark" 
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 15,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          padding: { top: 24, bottom: 24 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          contextmenu: false, 
        }}
      />
    </div>
  );
}