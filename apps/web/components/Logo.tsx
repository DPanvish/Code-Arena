import React from "react";

export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" className={className}>
      <defs>
        <linearGradient id="cyan-glow" x1="0" y1="0" x2="512" y2="512">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="indigo-glow" x1="0" y1="0" x2="512" y2="512">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <filter id="neon-shadow-cyan" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#22d3ee" floodOpacity="0.6"/>
        </filter>
        <filter id="neon-shadow-indigo" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#818cf8" floodOpacity="0.6"/>
        </filter>
      </defs>

      {/* The Geometric Colosseum Walls (C) */}
      <path
        d="M 400 96 L 208 96 L 112 192 L 112 320 L 208 416 L 400 416"
        stroke="url(#cyan-glow)"
        strokeWidth="56"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#neon-shadow-cyan)"
      />

      {/* The Authentic Terminal Prompt (>) - FLAT CORNERS & NO SHADOW */}
      <path
        d="M 208 176 L 288 256 L 208 336"
        stroke="url(#indigo-glow)"
        strokeWidth="56"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* The Cursor Node (_) */}
      <rect
        x="328" y="308" width="56" height="56" rx="14"
        fill="url(#indigo-glow)"
        filter="url(#neon-shadow-indigo)"
      >
        <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}