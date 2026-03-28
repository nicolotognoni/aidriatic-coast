# Digital Twin

> Turn your AI conversations into a cognitive Digital Twin — a persistent AI agent that knows you and can represent you to others.

Digital Twin transforms your interactions with LLMs into a living, queryable knowledge base. Your Twin learns your skills, preferences, decisions, and communication style, then uses that understanding to interact with other people's Twins on your behalf.

## How it works

```
┌─────────────┐     ┌─────────────────────┐     ┌──────────────────────────┐
│   ChatGPT   │────▶│  MCP Server         │────▶│  Supabase                │
│  (you talk) │◀────│  (12 tools + OAuth) │◀────│  (pg + pgvector + auth)  │
└─────────────┘     └─────────────────────┘     └──────────────────────────┘
                           ▲     │                         ▲
┌─────────────┐            │     │ Claude API              │
│   Webapp    │────────────┘     │ + Web Search            │
│  (manage)   │  API Routes      ▼                         │
└─────────────┘           ┌─────────────────┐              │
                          │  Agent Engine   │              │
                          │  (specialist +  │──────────────┘
                          │   friend twins) │  Google Calendar API
                          └─────────────────┘
```

1. **Talk to ChatGPT** as you normally do — the MCP tools automatically save relevant facts about you
2. **Your Twin builds up** a profile from your memories: identity, skills, preferences, opinions, goals
3. **Connect with friends** through the webapp — send and accept connection requests
4. **Ask each other's Twins** for feedback, reviews, and brainstorming through ChatGPT
5. **Create collaborative plans** with specialist AI agents + your friends' Twins
6. **Check availability** on friends' Google Calendar and request meetings

## Features

- **12 MCP Tools** — memory management, agent queries, collaborative planning, calendar, notifications
- **2 Interactive Widgets** — agent team selector + notifications card (rendered in ChatGPT)
- **8 Specialist Agents** — Frontend, Backend, Security, DevOps, UX, PM, Data, Mobile
- **Web Search** — agents research online for up-to-date recommendations in plans
- **Google Calendar** — check friends' availability and request meetings
- **Semantic Search** — pgvector embeddings for intelligent memory retrieval
- **Agent-to-Agent** — ask a friend's Twin for their perspective on your work
- **Plan Persistence** — plans saved to DB, retrievable from any client (ChatGPT, Claude Code)
- **Notifications** — real-time notification system with widget in ChatGPT + webapp dashboard
- **OAuth 2.1 + PKCE** — secure authentication with Supabase Auth

## Architecture

| Component | Stack | Purpose |
|-----------|-------|---------|
| **mcp-server-alpic/** | TypeScript, Skybridge, Alpic | MCP server with 12 tools, 2 widgets, OAuth |
| **webapp/** | Next.js 14, Tailwind, shadcn/ui | Admin panel: memories, connections, plans, notifications, settings |
| **supabase/** | PostgreSQL, pgvector, RLS | Database with vector search, row-level security, 8 tables |

### Database Schema

```
users ─────────── agents (1:1, auto-created)
  │
  ├── memories (pgvector embeddings, 9 categories)
  ├── connections (friend requests, status: pending/accepted/rejected)
  ├── plans (collaborative plans with full agent contributions)
  ├── notifications (cross-user, created via SECURITY DEFINER)
  ├── calendar_requests (meeting proposals between users)
  ├── user_integrations (Google Calendar OAuth tokens)
  └── audit_log (agent interaction tracking)
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `save_memory` | Save a fact about the user (identity, skills, preferences, goals, etc.) |
| `search_memories` | Semantic search across stored memories using pgvector |
| `extract_all_memories` | Bulk import multiple memories from a JSON payload |
| `ask_agent` | Query a connected friend's Digital Twin for feedback |
| `get_my_twin_status` | View Twin stats: memory count, connections, category breakdown |
| `list_agents` | Show available specialist agents + friends' Twins (renders widget) |
| `create_plan` | Create a collaborative plan with selected agents (auto-saved to DB) |
| `get_plan` | Retrieve a saved plan by name search |
| `list_plans` | List all saved plans |
| `get_notifications` | Show unread notifications (renders widget) |
| `check_availability` | Check a friend's Google Calendar availability |
| `request_meeting` | Propose a meeting with a connected friend |

## Quick Start

### Prerequisites

- Node.js 24+ (for MCP server with Skybridge)
- Node.js 20+ (for webapp with Next.js)
- Supabase project ([supabase.com](https://supabase.com))
- OpenAI API key (for embeddings)
- Anthropic API key (for agent engine)
- Alpic CLI (`npm install -g @alpic-ai/cli`) — for tunnel to ChatGPT
- Google Cloud credentials (optional, for calendar integration)

### 1. Clone and Install

```bash
git clone https://github.com/your-org/aidriatic-coast.git
cd aidriatic-coast

# Install MCP server dependencies
cd mcp-server-alpic && npm install

# Install webapp dependencies
cd ../webapp && npm install
```

### 2. Configure Environment

Each component has a `.env.example` file. Copy it and fill in your values:

```bash
# MCP Server
cp mcp-server-alpic/.env.example mcp-server-alpic/.env

# Webapp
cp webapp/.env.example webapp/.env.local
```

#### MCP Server (`mcp-server-alpic/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MCP_USE_OAUTH_SUPABASE_PROJECT_ID` | Yes | Your Supabase project ID (from Project Settings > General) |
| `SUPABASE_URL` | Yes | Supabase API URL, e.g. `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | Supabase publishable anon key (from Project Settings > API) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for the agent engine (Claude) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for ada-002 embeddings |
| `PORT` | No | Server port (default: `3001`) |
| `MCP_URL` | Yes | Public URL of the MCP server. Set to your Alpic tunnel URL after running `alpic tunnel` |

#### Webapp (`webapp/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same Supabase API URL as MCP server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Yes | Same Supabase anon key as MCP server |
| `OPENAI_API_KEY` | Yes | OpenAI API key for embeddings |

### 3. Set Up Supabase

Run the migrations from `supabase/migrations/` in order (00001 through 00011) in the Supabase SQL Editor.

Then enable in Supabase Dashboard:
- **Authentication > OAuth Server** — Enable + Allow Dynamic OAuth Apps
- **Authentication > Sign In / Providers** — Enable Email (with password)

### 4. Run

#### Start the Webapp

```bash
cd webapp
npm run dev
# Runs on http://localhost:3000
```

#### Start the MCP Server

```bash
cd mcp-server-alpic
npm run dev
# Runs on http://localhost:3001 (or next available port)
```

#### Expose with Alpic Tunnel (for ChatGPT)

In a separate terminal:

```bash
alpic tunnel --port 3001
# Returns a public URL like https://cool-marmot-fondue-420.alpic.dev
```

Then update `MCP_URL` in `mcp-server-alpic/.env` with the tunnel URL and restart the MCP server.

### 5. Connect to ChatGPT

1. ChatGPT > Settings > Apps > Add MCP
2. Paste your Alpic tunnel URL + `/mcp` (e.g. `https://cool-marmot-fondue-420.alpic.dev/mcp`)
3. Select OAuth, log in with your credentials
4. Start chatting!

## Project Structure

```
Digital-Twin/
├── mcp-server/
│   ├── index.ts                    # Server + 12 tools + OAuth
│   ├── resources/
│   │   ├── agent-selector/         # Agent team builder widget
│   │   └── notifications/          # Notifications card widget
│   └── src/services/
│       ├── supabase.ts             # Supabase client factory
│       ├── embedding.ts            # OpenAI ada-002 embeddings
│       ├── memory.ts               # Memory CRUD with deduplication
│       ├── agent-engine.ts         # Cross-user Twin queries via Claude
│       ├── plan-engine.ts          # Collaborative planning with web search
│       ├── plan-storage.ts         # Plan persistence (save/get/list)
│       ├── notification-service.ts # Cross-user notifications
│       ├── calendar-service.ts     # Google Calendar integration
│       ├── specialist-agents.ts    # 8 built-in specialist agents
│       └── prompt-builder.ts       # System prompt from memories
├── webapp/
│   └── src/app/
│       ├── (auth)/login/           # Email + password + Google login
│       ├── (dashboard)/
│       │   ├── dashboard/          # Stats overview
│       │   ├── twin/               # Twin profile + memories
│       │   ├── network/            # User search + friend requests
│       │   ├── plans/              # Saved collaborative plans
│       │   ├── notifications/      # Notification center
│       │   └── settings/           # Google Calendar integration
│       ├── oauth/consent/          # OAuth consent screen for MCP
│       └── api/                    # REST endpoints
└── supabase/
    └── migrations/                 # 11 migrations: schema + pgvector + RLS
```

## Key Design Decisions

- **ChatGPT-first** — The webapp is for admin; ChatGPT is where users live
- **Human connections only** — Friend requests are sent/accepted by users; agents talk only after acceptance
- **pgvector** — Semantic search in-database, no external vector service
- **Deduplication** — 95% cosine similarity threshold prevents duplicate memories
- **Web search in plans** — Agents use Anthropic's web_search tool for current recommendations
- **Parallel agent contributions** — Plan agents run in parallel via Promise.all (~2x faster)
- **Per-user calendar** — Each user connects their own Google Calendar; agents access only their owner's calendar
- **SECURITY DEFINER** — Cross-user operations (notifications, agent data) use Postgres security definer functions

## Deploy

```bash
# Alpic Cloud
cd mcp-server-alpic && npm run deploy

# Build for production
cd mcp-server-alpic && npm run build
cd mcp-server-alpic && npm run start
```

## License

MIT
