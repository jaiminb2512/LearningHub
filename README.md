# LearningHub

An AI-powered learning platform built around a LangGraph agent with persistent memory. Chat with an assistant that remembers your profile and projects across conversations, manage books and notes, and ground answers in your own uploaded documents.

## Features

- **Streaming chat** — SSE-based responses from a LangGraph agent with tool-calling and human-in-the-loop (HITL) interrupts
- **Long-term memory** — the agent extracts durable facts from your messages, deduplicates them semantically, and recalls relevant ones to personalize future conversations
- **Short-term memory** — per-thread conversation summaries keep long threads within context limits
- **RAG** — semantic search over chat history and uploaded knowledge files (PDF, DOCX)
- **Books & notes** — organize learning material, manipulable by the agent through tools
- **MCP server** — exposes LearningHub capabilities over the Model Context Protocol
- **Observability** — Langfuse tracing across all agent runs

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5, ES modules |
| AI | LangChain / LangGraph, Google Gemini |
| Database | PostgreSQL + pgvector, Prisma ORM |
| Jobs | pg-boss |
| Frontend | React 19, Vite (rolldown), MUI, React Router |
| Tracing | Langfuse + OpenTelemetry |

## Architecture

### Request flow

A chat request streams the agent response immediately, then enqueues background work so the user never waits on side-effects:

```
POST /api/ai/stream
  │
  ├─ build system prompt (+ retrieved long-term memories, RAG context)
  ├─ run LangGraph:  START → agent ⇄ tools → END
  ├─ stream tokens to client (SSE)
  ├─ persist assistant message
  │
  └─ enqueue (pg-boss)
       ├─ memory-generation   → extract & persist long-term memories
       └─ summary-generation  → update thread conversation summary
```

Summarization and memory extraction run **outside** the graph. Both were previously inline, which blocked the stream until the side-work finished.

### Long-term memory pipeline

Extraction and persistence are separated so deduplication is deterministic rather than left to the model:

1. **Extract** — an LLM classifies candidate memories by type (`PROFILE`, `PROJECT`, `EPISODIC`, `SEMANTIC`, `PERIODIC`) with confidence and importance scores
2. **Normalize** — content is lowercased and whitespace-collapsed, then SHA-256 fingerprinted
3. **Deduplicate** — in order:
   - exact fingerprint match → touch `lastAccessedAt`, raise confidence/importance if higher
   - cosine similarity ≥ 0.94 → treat as a semantic duplicate, touch it
   - similarity ≥ 0.85 in the same category → mark the old memory `SUPERSEDED`, create the new one
   - otherwise → create a new memory
4. **Embed** — 3072-dim Gemini embeddings stored in a pgvector column
5. **Retrieve** — ranked by `similarity × 0.7 + importance × 0.2 + recency × 0.1`

### Backend layout

```
Backend/
├── index.js              Express app, MCP endpoint, startup sequence
├── config/               pg-boss setup
├── controllers/          HTTP handlers
├── services/             business logic (memory, summary, RAG, CRUD)
├── workers/              pg-boss background job handlers
├── utils/                agent graph, tools, prompts, RAG, auth helpers
├── mcp/                  MCP server definition
├── prisma/               schema and migrations
└── docs/                 Swagger spec
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL with the `vector` extension available
- A Google Gemini API key

### Setup

```bash
git clone <repository-url>
cd LearningHub

# Backend
cd Backend
npm install
cp .envExample .env     # then fill in the values below
npx prisma migrate deploy
npx prisma generate

# Frontend
cd ../Frontend
npm install
```

### Environment

Create `Backend/.env`:

```env
PORT=3009
JWT_SECRET=<your-secret>
JWT_EXPIRES_IN=7d
FRONTEND_URLS=http://localhost:3010
DATABASE_URL=postgresql://user:password@localhost:5432/learninghub
GEMINI_API_KEY=<your-gemini-api-key>
```

Langfuse tracing is optional; set `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and `LANGFUSE_BASEURL` to enable it.

### Running

```bash
# Both services together
cd Backend && npm run dev:full

# Or separately
cd Backend && npm run dev      # http://localhost:3009
cd Frontend && npm run dev     # http://localhost:3010
```

| Endpoint | URL |
|---|---|
| API | http://localhost:3009/api |
| Swagger docs | http://localhost:3009/api-docs |
| MCP | http://localhost:3009/mcp |

## API

All routes are prefixed with `/api` and require a JWT bearer token except user registration and login.

| Route | Purpose |
|---|---|
| `/users` | registration, login, profile |
| `/threads` | conversation CRUD |
| `/ai` | `generate`, `stream`, `resume`, providers, token usage |
| `/system-prompts` | prompt templates |
| `/books` | book CRUD |
| `/notes` | note CRUD |
| `/ai-settings` | model, temperature, RAG toggles |
| `/knowledge` | file upload and knowledge-source management |

## Data Model

Core entities: `User`, `Thread`, `Message`, `Summary`, `LongTermMemory`, `Document`, `Book`, `Note`, `AiSetting`, `KnowledgeSource`, `KnowledgeChunk`.

Both `Document` and `LongTermMemory` carry `vector(3072)` embedding columns queried with pgvector cosine distance.

## Background Workers

Registered on startup via pg-boss:

| Queue | Worker | Behavior |
|---|---|---|
| `memory-generation` | `memoryGenerationWorker` | extracts long-term memories from user messages |
| `summary-generation` | `summaryGenerationWorker` | regenerates the thread summary once token count exceeds the threshold |

Failed jobs throw so pg-boss retries them per its configured policy.

## Scripts

**Backend**

| Command | Description |
|---|---|
| `npm run dev` | start with nodemon |
| `npm start` | start in production |
| `npm run dev:full` | start backend and frontend together |
| `npm run seed` | seed the database |
| `npm run build` | generate the Prisma client |

**Frontend**

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | production build |
| `npm run lint` | run ESLint |
| `npm run preview` | preview the build |
