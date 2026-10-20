# Collaborative Task Board

A multi-workspace task management app: workspaces with admin/member roles, projects, tasks, live task events over WebSockets, Redis caching for task lists, and an AI feature that breaks a requirement into prioritized tasks.

**Stack:** Node.js · Express 5 · TypeScript · PostgreSQL (raw SQL via `pg`) · Redis (`ioredis`) · WebSockets (`ws`) · JWT in httpOnly cookies · Google Gemini · React + Vite + Tailwind

> Status: a working portfolio project. See [Known limitations](#known-limitations) for what it does not do.

## Features

- **Workspaces and roles.** Create a workspace (you become admin), join one, list members. Admin-only actions (create projects, delete a workspace) are enforced by middleware, and deleting a workspace or project additionally requires being its owner.
- **Projects and tasks.** Create tasks with priority and an optional assignee; the assignee must belong to the workspace. Task writes run in a transaction and write an activity log row.
- **Cached task lists.** `GET /task?project_id=` uses Redis cache-aside (key `project:{id}:tasks`, 300 s TTL). The key is deleted when a task is created or deleted. Authorization runs *before* the cache lookup, so cached data is never served to non-members. If Redis is unavailable, requests fall back to Postgres.
- **Live task events.** The server broadcasts `task_created` and `task_deleted` to everyone subscribed to that workspace. The WebSocket handshake is authenticated with the same cookie as the REST API, and joining a workspace room requires membership.
- **AI task decomposition.** `POST /task/ai-decompose` sends a requirement to Gemini (`gemini-2.5-flash`, structured JSON output) and returns suggested tasks with priorities and effort estimates. The result is not saved until the client creates the tasks.
- **Auth.** bcrypt password hashing, JWT in an httpOnly cookie, server-side logout, 401 for missing/invalid/expired sessions, identical error for unknown email and wrong password.

## Architecture

```
React (Vite) ──HTTP + cookie──▶ Express ──▶ PostgreSQL   (source of truth)
     │                            │  └────▶ Redis        (task-list cache)
     └────────WebSocket───────────┘  └────▶ Gemini API   (task decomposition)
```

Request flow for a cached read: `verifyUser` → membership check in Postgres → Redis `GET` → on miss, query Postgres and `SET` with TTL.

## Getting started

Tested with Node 22. Requires Docker (for Postgres and Redis).

```bash
# 1. Databases
docker run -d --name wf-postgres -e POSTGRES_PASSWORD=change-me -e POSTGRES_DB=workflow_db -p 5432:5432 postgres:16
docker run -d --name wf-redis -p 6379:6379 redis:7

# 2. Create the tables
docker exec -i wf-postgres psql -U postgres -d workflow_db < backend/db/schema.sql

# 3. Backend
cd backend
cp .env.example .env        # set DB_PASS (same as above), JWT_SECRET_KEY, GEMINI_API_KEY
npm ci
npm run build
npm start                   # http://localhost:3000

# 4. Frontend (second terminal)
cd frontend
npm ci
npm run dev                 # http://localhost:5173
```

Notes:
- `GEMINI_API_KEY` must be set for the server to start. Any placeholder works unless you use the AI decomposition feature.
- Keep `PORT=3000` in `backend/.env`, or set `VITE_API_BASE_URL` for the frontend. The WebSocket URL is derived from the same variable.
- `CORS_ORIGIN` must exactly match the frontend origin (credentials are enabled).

## Testing

There are no unit tests or CI yet. Two scripts exercise a running server (plain Node, no extra dependencies):

```bash
cd backend
npm run test:security   # 17 checks: authorization, cache behaviour, WebSocket isolation, logout, log hygiene
npm run bench:cache     # cache hit vs miss latency (see below)
```

Run both against a throw-away database: they create their own users, workspaces and tasks. Start the server fresh before each benchmark run.

### Cache benchmark (one local machine)

The benchmark compares the same request on the same rows with the Redis key deleted before each request (MISS: membership check, database query, cache write) versus served from Redis (HIT, which also includes the membership check). It aborts if a response has the wrong row count or `fromCache` flag.

On one Windows laptop (i5-13500HX, 16.9 GB RAM; client, server, Postgres and Redis on the same machine), 3 runs of 200 samples per mode with a fresh database and server restart for each run: cache hits had about 1.4x to 1.6x lower median latency than misses for projects of 100 to 5,000 tasks (about 17 ms vs 24 ms at 5,000 tasks). Single sequential client only; this says nothing about concurrency, network latency or production scale, and a miss includes the cache write, so it is not a comparison against having no cache.

## API

All routes except `/auth/register` and `/auth/login` require the session cookie.

| Method | Path | Access |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | public |
| POST | `/workspace/create` | any user |
| GET | `/workspace/available` | any user |
| POST | `/workspace/join` | any user (see limitations) |
| GET | `/workspace` | any user (your workspaces) |
| GET | `/workspace/:id`, `/workspace/members/:workspace_id` | workspace members |
| DELETE | `/workspace/:id` | workspace admin who owns it |
| POST | `/project/create` | workspace admin |
| GET | `/project?workspace_id=` , `/project/:id` | workspace members |
| DELETE | `/project/:id` | workspace owner |
| POST | `/task/create` | workspace members |
| GET | `/task?project_id=` , `/task/:id` | workspace members of the project |
| DELETE | `/task/:id` | workspace members of the project |
| POST | `/task/ai-decompose` | any signed-in user |
| POST | `/comment/create` | workspace members |
| DELETE | `/comment/:id` | the comment's author |

### WebSocket

Connect to the API origin with the session cookie. Send `{"type":"join-workspace","workspaceId":<id>}`. If you are a member, you then receive `{"event":"task_created","data":...}` and `{"event":"task_deleted","data":...}` for that workspace; otherwise you receive `{"event":"error",...}` and are not subscribed.

## Project structure

```
backend/
  src/controllers, routes, services   request handling and business logic
  src/db/queries                      raw SQL
  src/middleware                      auth, role checks, error handling
  db/schema.sql                       tables and indexes
  scripts/                            authz-check.mjs, bench-cache.mjs
frontend/
  src/components                      React UI
```

## Known limitations

- **Open workspace joining.** Any signed-in user can list and join any workspace, so workspace isolation is only as strong as that join policy. Invitations or approval would be the next step.
- **Tasks cannot be edited after creation.** Tasks have a `status` column, but there is no endpoint to change status, assignee or content yet, and no workflow transitions.
- **Comments are API-only.** The endpoints exist; the UI does not use them. Comments are not broadcast over WebSockets.
- **Single server instance.** WebSocket rooms are an in-process map; Redis is used for caching only, not pub/sub.
- **No rate limiting or `helmet`,** including on the paid Gemini endpoint.
- **No unit tests or CI.** Only the integration scripts above.
- **Cache race.** Invalidation is delete-after-write with no locking, so a concurrent read can briefly re-cache an old list; the TTL bounds it.