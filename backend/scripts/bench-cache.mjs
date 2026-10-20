// Cache benchmark for GET /task?project_id=...  (Redis cache-aside, 300s TTL)
//
// What it measures: latency of the SAME request on the SAME dataset when
//   - MISS: the Redis key is deleted right before the request (DB query + cache write), and
//   - HIT : the key is already cached (served from Redis).
// Both include the membership/auth check the server does before the cache lookup.
// Single client, sequential requests. It makes NO throughput or concurrency claims.
//
// Usage (server + Postgres + Redis must already be running, freshly restarted after any code change):
//   LABEL=patched-run1 BASE=http://localhost:3000 node scripts/bench-cache.mjs
// Optional env: SIZES=100,1000,5000  SAMPLES=200  WARMUP=20  OUT=bench-result.json
//   DB_HOST DB_USER DB_PASS DB_NAME REDIS_URL  (same names/defaults as the app)
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import os from "node:os";
import pg from "pg";
import Redis from "ioredis";

const BASE = process.env.BASE || "http://localhost:3000";
const LABEL = process.env.LABEL || "unlabeled";
const SIZES = (process.env.SIZES || "100,1000,5000").split(",").map(Number);
const SAMPLES = Number(process.env.SAMPLES || 200);
const WARMUP = Number(process.env.WARMUP || 20);
const OUT = process.env.OUT || `bench-${LABEL}-${Date.now()}.json`;

const fail = (msg) => { console.error("ABORT:", msg); process.exit(1); };

// ---- tiny cookie client -------------------------------------------------
let cookie = "";
const call = async (method, path, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const tok = (res.headers.getSetCookie?.() ?? []).find((c) => c.startsWith("token="));
  if (tok) cookie = tok.split(";")[0];
  const text = await res.text();
  return { status: res.status, text, json: (() => { try { return JSON.parse(text); } catch { return null; } })(), bytes: Buffer.byteLength(text) };
};

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
const stats = (ms) => {
  const s = [...ms].sort((a, b) => a - b);
  return {
    n: s.length,
    mean_ms: +(s.reduce((a, b) => a + b, 0) / s.length).toFixed(3),
    p50_ms: +pct(s, 50).toFixed(3),
    p95_ms: +pct(s, 95).toFixed(3),
    min_ms: +s[0].toFixed(3),
    max_ms: +s[s.length - 1].toFixed(3),
  };
};

const timedGet = async (path) => {
  const t0 = performance.now();
  const r = await call("GET", path);
  return { ms: performance.now() - t0, r };
};

const main = async () => {
  const pool = new pg.Pool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || "root",
    database: process.env.DB_NAME || "workflow_db",
  });
  const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

  // account + workspace through the real API
  const email = `bench_${Date.now()}@test.local`;
  let r = await call("POST", "/auth/register", { email, password: "Passw0rd!bench" });
  if (r.status !== 201) fail(`register failed: ${r.status} ${r.text}`);
  const userId = r.json.data.id;
  r = await call("POST", "/workspace/create", { name: `bench-${Date.now()}` });
  if (r.status !== 201 && r.status !== 200) fail(`workspace create failed: ${r.status} ${r.text}`);
  const workspaceId = r.json.data.id;

  const results = [];
  for (const size of SIZES) {
    r = await call("POST", "/project/create", { name: `bench-${size}`, workspace_id: workspaceId });
    if (r.status !== 201 && r.status !== 200) fail(`project create failed: ${r.status} ${r.text}`);
    const projectId = r.json.data.id;

    // seed directly in SQL (fast); each row has realistic title/description/priority
    await pool.query(
      `INSERT INTO tasks (title, description, priority, project_id, assigned_user_id)
       SELECT 'Task number ' || g, 'Description text for task ' || g, 'medium', $1, $2 FROM generate_series(1, $3) g`,
      [projectId, userId, size],
    );
    const dbCount = Number((await pool.query("SELECT count(*) FROM tasks WHERE project_id=$1", [projectId])).rows[0].count);
    if (dbCount !== size) fail(`seeded ${dbCount} rows, expected ${size}`);

    const path = `/task?project_id=${projectId}`;
    const key = `project:${projectId}:tasks`;
    const validate = (resp, expectCache, phase) => {
      if (resp.status !== 200) fail(`${phase}: status ${resp.status}`);
      const n = resp.json?.data?.length;
      if (n !== size) fail(`${phase}: got ${n} tasks, expected ${size} (stale/mislabeled dataset?)`);
      if (resp.json?.fromCache !== expectCache) fail(`${phase}: fromCache=${resp.json?.fromCache}, expected ${expectCache}`);
    };

    // warm-up (discarded): JIT, connection pools
    for (let i = 0; i < WARMUP; i++) { await redis.del(key); await timedGet(path); await timedGet(path); }

    // MISS samples: delete key right before each request
    const miss = []; let bytes = 0;
    for (let i = 0; i < SAMPLES; i++) {
      await redis.del(key);
      const { ms, r: resp } = await timedGet(path);
      validate(resp, false, "miss"); bytes = resp.bytes; miss.push(ms);
    }
    // HIT samples: populate once, then read repeatedly
    await redis.del(key); await timedGet(path);
    const hit = [];
    for (let i = 0; i < SAMPLES; i++) {
      const { ms, r: resp } = await timedGet(path);
      validate(resp, true, "hit"); hit.push(ms);
    }

    const m = stats(miss), h = stats(hit);
    results.push({ tasks_in_project: size, response_bytes: bytes, miss: m, hit: h, p50_speedup_x: +(m.p50_ms / h.p50_ms).toFixed(2), rows_verified: true, fromCache_flags_verified: true });
    console.log(`size=${size}  MISS p50=${m.p50_ms}ms p95=${m.p95_ms}ms | HIT p50=${h.p50_ms}ms p95=${h.p95_ms}ms | ${bytes} bytes`);
  }

  let commit = "unknown", dirty = "unknown";
  try { commit = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); dirty = execSync("git status --porcelain -- ../backend/src ../backend/package.json", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() ? "uncommitted changes in backend/src" : "clean"; } catch {}

  const out = {
    label: LABEL,
    timestamp: new Date().toISOString(),
    git_commit: commit,
    working_tree_backend: dirty,
    method: "sequential single client; MISS = redis DEL before each request; HIT = cached key; includes server-side membership check",
    samples_per_mode: SAMPLES, warmup_pairs: WARMUP,
    environment: { node: process.version, platform: `${os.platform()} ${os.release()}`, cpu: os.cpus()[0]?.model, cpu_count: os.cpus().length, total_mem_gb: +(os.totalmem() / 1e9).toFixed(1), note: "client, server, Postgres and Redis all on this one machine" },
    results,
  };
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\nwrote ${OUT}`);
  await pool.end(); redis.disconnect();
};
main().catch((e) => fail(e?.stack || String(e)));
