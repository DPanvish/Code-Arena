# CodeArena Project Structure

This document outlines the directory and file structure of the CodeArena monorepo.

## Overview
CodeArena is a Next.js, Fastify, and Python-based competitive programming platform organized as a Turborepo workspace.

## Apps

### 1. `apps/web` (Next.js Frontend)
- **`app/`**: Next.js 14 App Router application structure.
  - **`admin/`**: Admin dashboard and problem management.
  - **`api/`**: Next.js API Routes (`auth`, `problems`, `submissions`, `users`).
  - **`login/`, `register/`**: Authentication pages.
  - **`problems/`**: Problem list and solving workspace (`ProblemWorkspace.tsx`).
  - **`sandbox/`**: Code sandbox testing environment.
- **`components/`**: Reusable frontend components (`CodeEditor.tsx`, `Navbar.tsx`, `AuthProvider.tsx`, `Logo.tsx`, `VisualizerPanel.tsx`, `VariableWatchPanel.tsx`, `CallStackPanel.tsx`).
- **`lib/`**: Frontend utility functions (`auth.ts`, `queue.ts`).
- **`types/`**: TypeScript declarations (`next-auth.d.ts`, `tracer.ts`).
- **Config Files**: `next.config.js`, `postcss.config.mjs`, `eslint.config.js`, `tsconfig.json`.

### 2. `apps/judge` (Execution Service)
- **`index.ts`**: Entry point for the judge worker (BullMQ) and the native HTTP API server (port 3001 for `/trace` requests).
- **`runner.ts`**: Logic for sandboxed code execution and tracing (using Node/Python).
- **`tracer.py`**: Python execution tracer that captures line-by-line snapshots (Phase 3 Visualizer Engine).
- **`.env`, `package.json`**: Judge configurations.

### 3. `apps/worker`
- Dedicated directory for background job processing (e.g., BullMQ for plagiarism checks, notifications).

## Packages

### 1. `packages/db` (Database)
- **`prisma/schema.prisma`**: Single source of truth for the PostgreSQL database schema.
- **`index.ts`**: Prisma client exports.
- **`prisma.config.ts`**: Prisma configuration.

### 2. `packages/ui` (Claymorphism Component Library)
- **`src/` & `components/`**: Shared UI components (`Button.tsx`, `Card.tsx`, `code.tsx`).
- **`utils/cn.ts`**: Tailwind class merging utility.
- **`styles.css`**: Global design tokens and Claymorphism classes.

### 3. `packages/config`
- Shared configuration files (`tsconfig.json`).

### 4. `packages/eslint-config`
- Shared ESLint configurations (`base.js`, `next.js`, `react-internal.js`).

### 5. `packages/typescript-config`
- Shared TypeScript configurations (`base.json`, `nextjs.json`, `react-library.json`).

### 6. `packages/types`
- Directory for shared TypeScript types (e.g., Zod schemas, API contracts).

## Root Level
- **`.agent/skills/`**: Contains Antigravity skills used to guide the development and architecture of the project (e.g., api-design-principles, security-auditor, typescript-pro, nextjs-app-router-patterns).
- **`CodeArena_Roadmap.md`**: Detailed product roadmap, architecture, and phase planning.
- **`turbo.json`, `pnpm-workspace.yaml`, `package.json`**: Monorepo orchestration configuration files.
- **`infrastructure/`**: Terraform scripts (`main.tf`) for cloud infrastructure deployment.
- **`.github/workflows/ci.yml`**: GitHub Actions pipeline definitions.
