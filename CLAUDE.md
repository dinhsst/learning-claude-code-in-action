# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps + prisma generate + migrate
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all Vitest tests
npx vitest run src/path/to/file.test.ts  # Run a single test file
npm run db:reset     # Reset SQLite database (destructive)
```

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY` to use real Claude. Without it, the app falls back to a mock provider that generates static components.

## Architecture

UIGen is a Next.js 15 App Router app where users chat with Claude to generate React components, which are previewed live in an iframe.

### Request Flow

1. User submits a message in the chat panel
2. `ChatProvider` (`src/lib/contexts/chat-context.tsx`) calls `POST /api/chat` via Vercel AI SDK streaming
3. The API route (`src/app/api/chat/route.ts`) builds a system prompt, serializes the current virtual filesystem into the message, and calls the language model
4. Claude streams back tool calls (`str_replace_editor`, `file_manager`) that mutate the virtual filesystem
5. The updated files are passed to `jsx-transformer.ts` which compiles JSX via Babel standalone and builds an iframe-loadable HTML document with an import map
6. `PreviewFrame` renders the output in a sandboxed iframe

### Virtual File System

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory `Map<string, string>` that lives client-side. It is serialized into chat messages sent to the API (so the model always sees current file state) and persisted to the Prisma DB as JSON for logged-in users. The entrypoint Claude must always create is `/App.jsx`.

### Language Model Provider

`src/lib/provider.ts` exports a single `getLanguageModel()` function. It returns a real Anthropic `claude-haiku-4-5` model when `ANTHROPIC_API_KEY` is set, otherwise a mock that returns hard-coded component code. Max tokens: 10,000; max steps: 40 (real) / 4 (mock).

### AI Tools

Two tools are registered with the model:
- `str_replace_editor` (`src/lib/tools/str-replace.ts`) — find-and-replace within a file
- `file_manager` (`src/lib/tools/file-manager.ts`) — create/delete files and directories

Both tools write to the `VirtualFileSystem` instance passed from context.

### Auth & Persistence

- JWT sessions stored in HTTP-only cookies (7-day expiry), managed via `src/lib/auth.ts` (uses `jose`)
- Server Actions in `src/actions/index.ts` handle sign-up, sign-in, sign-out, and project CRUD
- SQLite via Prisma (`prisma/schema.prisma`): two models — `User` and `Project` (messages + filesystem data stored as JSON columns)
- Anonymous users can work without signing in; projects are linked to a session cookie

### Key Path Alias

`@/*` resolves to `src/*`. This alias is also injected into the preview iframe import map so generated components can import each other with `@/ComponentName`.
