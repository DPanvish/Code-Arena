"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { useMonaco, OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
  problemId: string;
  language: string;
  defaultCode?: string;
  onSubmit: (code: string) => void;
  onRunSamples: (code: string) => void;
}

export default function CodeEditor({
  problemId,
  language,
  defaultCode = "",
  onSubmit,
  onRunSamples,
}: CodeEditorProps) {
  const monaco = useMonaco();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const onSubmitRef = useRef(onSubmit);
  const onRunSamplesRef = useRef(onRunSamples);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
    onRunSamplesRef.current = onRunSamples;
  });
  
  // unique cache key for this specific problem and language
  const cacheKey = `codearena-cache-${problemId}-${language}`;
  
  const [code, setCode] = useState<string>(defaultCode);

  // Load from localStorage on mount
  useEffect(() => {
    const cachedCode = localStorage.getItem(cacheKey);
    if (cachedCode) {
      setCode(cachedCode);
    } else {
      setCode(defaultCode);
    }
  }, [cacheKey, defaultCode]);

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme("clay-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6b7280", fontStyle: "italic" },
          { token: "keyword", foreground: "818cf8" }, 
          { token: "string", foreground: "22d3ee" },  
        ],
        colors: {
          "editor.background": "#121217", 
          "editor.lineHighlightBackground": "#1e1e24",
          "editorLineNumber.foreground": "#4b5563",
          "editorIndentGuide.background": "#2d3748",
          "editorSuggestWidget.background": "#1f2937",
        },
      });
      monaco.editor.setTheme("clay-dark");
    }
  }, [monaco]);

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;

    // Shortcut: Ctrl + Enter to Submit
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
      () => {
        const currentCode = editor.getValue();
        onSubmitRef.current(currentCode);
      }
    );

    // Shortcut: Ctrl + Shift + R to Run Samples
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyR,
      () => {
        const currentCode = editor.getValue();
        onRunSamplesRef.current(currentCode);
      }
    );
  };

  const handleEditorChange = (value: string | undefined) => {
    const newVal = value || "";
    setCode(newVal);
    // Persist to localStorage on every keystroke
    localStorage.setItem(cacheKey, newVal);
  };

  const getMonacoLanguage = (lang: string) => {
    const map: Record<string, string> = {
      cpp: "cpp",
      python3: "python",
      openjdk: "java",
      node: "javascript",
      rustc: "rust",
      go: "go",
    };
    return map[lang] || "plaintext";
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-inner">
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        theme="clay-dark"
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 15,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          padding: { top: 16 },
          scrollBeyondLastLine: false,
        }}
        loading={
          <div className="flex h-full items-center justify-center bg-[#121217] text-gray-400 font-mono text-sm">
            Booting Engine...
          </div>
        }
      />
    </div>
  );
}