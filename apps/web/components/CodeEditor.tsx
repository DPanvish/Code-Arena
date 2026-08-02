"use client";

import { useState, useEffect, useRef } from "react";
import Editor, { DiffEditor, useMonaco } from "@monaco-editor/react";

interface CodeEditorProps {
  problemId: string;
  language: string;
  defaultCode: string;
  onSubmit: (code: string) => void;
  onRunSamples?: () => void;
  highlightedLine?: number | null;
  isDiffMode?: boolean;
  diffOriginalCode?: string;
}

export default function CodeEditor(props: CodeEditorProps) {
  const { 
    problemId, 
    language, 
    defaultCode, 
    onSubmit, 
    onRunSamples,
    isDiffMode,
    diffOriginalCode 
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

  const setupEditorBindings = (targetEditor: any, monaco: any) => {
    editorRef.current = targetEditor;
    monacoRef.current = monaco;
    
    const decorationsCol = targetEditor.createDecorationsCollection([]);
    decorationsRef.current = decorationsCol;

    // Apply current highlight immediately in case mode switched while tracing
    if (props.highlightedLine) {
      decorationsCol.set([{
        range: new monaco.Range(props.highlightedLine, 1, props.highlightedLine, 1),
        options: {
          isWholeLine: true,
          className: 'bg-indigo-500/30',
        }
      }]);
    }

    // Ctrl/Cmd + Enter -> Submit Code
    targetEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      const currentCode = targetEditor.getValue();
      onSubmit(currentCode);
    });

    // Ctrl/Cmd + Shift + R -> Run Sample Tests
    targetEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyR, () => {
      if (onRunSamples) {
        onRunSamples();
      }
    });
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    setupEditorBindings(editor, monaco);
  };

  const handleDiffEditorDidMount = (diffEditor: any, monaco: any) => {
    const modifiedEditor = diffEditor.getModifiedEditor();
    setupEditorBindings(modifiedEditor, monaco);
    
    // Subscribe to changes in diff mode
    modifiedEditor.onDidChangeModelContent(() => {
      handleEditorChange(modifiedEditor.getValue());
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

  const commonOptions = {
    minimap: { enabled: false },
    fontSize: 15,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    padding: { top: 24, bottom: 24 },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: "smooth",
    contextmenu: false, 
  };

  return (
    <div className="w-full h-full absolute inset-0">
      {isDiffMode ? (
        <DiffEditor
          height="100%"
          language={language}
          theme="vs-dark"
          original={diffOriginalCode || ""}
          modified={code}
          onMount={handleDiffEditorDidMount}
          options={commonOptions as any}
        />
      ) : (
        <Editor
          height="100%"
          language={language}
          theme="vs-dark" 
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={commonOptions as any}
        />
      )}
    </div>
  );
}