// Security regression checks. Plain Node (fetch + ws). Run against a LOCAL server + Postgres + Redis.
//   BASE=http://localhost:3000 SERVER_LOG=/path/to/server.log node scripts/authz-check.mjs
// Each check prints PASS (secure behaviour) or FAIL (vulnerable / buggy behaviour).
import { readFileSync } from "node:fs";
import WebSocket from "ws";

const BASE = process.env.BASE || "http://localhost:3000";
const SERVER_LOG = process.env.SERVER_LOG || "";
const run = Date.now();
const results = [];

const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
};

// minimal cookie-aware client
const client = () => {
  let cookie = "";
  const call = async (method, path, body) => {
    const res = await fetch(BASE + path, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.getSetCookie?.() ?? [];
    const tok = set.find((c) => c.startsWith("token="));
    if (tok) cookie = tok.split(";")[0];
    let json = null;
    try { json = await res.json(); } catch {}
    return { status: res.status, json, setCookie: set };
  };
  return { call, get cookie() { return cookie; } };
};

const signup = async (label) => {
  const c = client();
  const email = `${label}_${run}@test.local`;
  const r = await c.call("POST", "/auth/register", { email, password: "Passw0rd!x" });
  if (r.status !== 201) throw new Error(`register ${label} failed: ${r.status} ${JSON.stringify(r.json)}`);
  return { c, email, id: r.json.data.id };
};

const wsConnect = (cookie, workspaceId) =>
  new Promise((resolve, reject) => {
    const events = [];
    const ws = new WebSocket(BASE.replace("http", "ws") + "/", { headers: { Cookie: cookie } });
    ws.on("open", () => { ws.send(JSON.stringify({ type: "join-workspace", workspaceId })); setTimeout(() => resolve({ ws, events }), 300); });
    ws.on("message", (m) => events.push(JSON.parse(m.toString())));
    ws.on("error", reject);
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  const alice = await signup("alice"); // workspace owner/admin
  const bob = await signup("bob");     // member
  const eve = await signup("eve");     // outsider, never joins W1

  const w1 = (await alice.c.call("POST", "/workspace/create", { name: "W1" })).json.data.id;
  const w2 = (await alice.c.call("POST", "/workspace/create", { name: "W2" })).json.data.id;
  await bob.c.call("POST", "/workspace/join", { workspace_id: w2 }); // bob only in W2
  const p1 = (await alice.c.call("POST", "/project/create", { name: "P1", workspace_id: w1 })).json.data.id;
  const t1 = (await alice.c.call("POST", "/task/create", { title: "secret task", description: "d", priority: "high", project_id: p1, assigned_user_id: alice.id, workspace_id: w1 })).json.data.id;

  // 1. unauthenticated request should be 401, not 500
  const anon = client();
  const r1 = await anon.call("GET", `/task?project_id=${p1}`);
  check("unauthenticated GET /task returns 401", r1.status === 401, `status=${r1.status}`);

  // 2. login must not reveal whether an email exists
  const r2a = await anon.call("POST", "/auth/login", { email: `nobody_${run}@test.local`, password: "x" });
  const r2b = await anon.call("POST", "/auth/login", { email: alice.email, password: "wrong" });
  check("login: unknown email and wrong password look identical", r2a.status === r2b.status && r2a.json?.message === r2b.json?.message, `unknown=${r2a.status}/${r2a.json?.message} wrong=${r2b.status}/${r2b.json?.message}`);

  // 3. outsider must not read tasks (call twice so the 2nd would be served from cache)
  await alice.c.call("GET", `/task?project_id=${p1}`); // warm cache
  const r3 = await eve.c.call("GET", `/task?project_id=${p1}`);
  check("outsider cannot list another workspace's tasks (even when cached)", r3.status === 403 || r3.status === 404, `status=${r3.status} fromCache=${r3.json?.fromCache}`);

  // 4-6. other read endpoints
  const r4 = await eve.c.call("GET", `/task/${t1}`);
  check("outsider cannot read GET /task/:id", r4.status === 403 || r4.status === 404, `status=${r4.status}`);
  const r5 = await eve.c.call("GET", `/project/${p1}`);
  check("outsider cannot read GET /project/:id", r5.status === 403 || r5.status === 404, `status=${r5.status}`);
  const r6 = await eve.c.call("GET", `/workspace/members/${w1}`);
  check("outsider cannot list workspace members", r6.status === 403 || r6.status === 404, `status=${r6.status}`);

  // 7. WebSocket: outsider joins W1 room, alice creates a task -> outsider must receive nothing
  const evil = await wsConnect(eve.c.cookie, w1);
  await alice.c.call("POST", "/task/create", { title: "ws-leak-probe", description: "", priority: "low", project_id: p1, assigned_user_id: alice.id, workspace_id: w1 });
  await sleep(500);
  const leaked = evil.events.filter((e) => String(e.event).startsWith("task_"));
  check("WebSocket: non-member does not receive workspace events", leaked.length === 0, `task events=${leaked.length}; all events=${JSON.stringify(evil.events.map((e) => e.event))}`);
  evil.ws.close();

  // 8. cross-workspace broadcast: bob (member of W2 only) listens in W2; alice (member of both)
  //    creates a task in W1's project but claims workspace_id=W2 -> W2 listeners must NOT get it
  await bob.c.call("GET", "/task?project_id=0").catch(() => {});
  const w2listener = await wsConnect(bob.c.cookie, w2);
  await alice.c.call("POST", "/task/create", { title: "cross-ws-probe", description: "", priority: "low", project_id: p1, assigned_user_id: alice.id, workspace_id: w2 });
  await sleep(500);
  const leaked2 = w2listener.events.filter((e) => String(e.event).startsWith("task_"));
  check("task event is broadcast to the project's own workspace, not a body-supplied one", leaked2.length === 0, `W2 listener task events=${leaked2.length}`);
  w2listener.ws.close();

  // ---- positive controls: legitimate member behaviour must still work ----
  const pc1 = await alice.c.call("GET", `/task?project_id=${p1}`);
  const baseCount = pc1.json?.data?.length ?? -1;
  check("member can list tasks", pc1.status === 200 && baseCount >= 1, `status=${pc1.status} count=${baseCount}`);
  const pc2 = await alice.c.call("GET", `/task?project_id=${p1}`);
  check("second identical read is served from cache", pc2.json?.fromCache === true, `fromCache=${pc2.json?.fromCache}`);
  await alice.c.call("POST", "/task/create", { title: "invalidate-probe", description: "", priority: "low", project_id: p1, assigned_user_id: alice.id, workspace_id: w1 });
  const pc3 = await alice.c.call("GET", `/task?project_id=${p1}`);
  check("create invalidates the cache (new task visible, not served stale)", pc3.json?.fromCache === false && pc3.json?.data?.length === baseCount + 1, `fromCache=${pc3.json?.fromCache} count=${pc3.json?.data?.length} expected=${baseCount + 1}`);
  const pc4 = await alice.c.call("POST", "/task/create", { title: "bad assignee", description: "", priority: "low", project_id: p1, assigned_user_id: eve.id, workspace_id: w1 });
  check("cannot assign a task to a non-member", pc4.status >= 400 && pc4.status < 500, `status=${pc4.status}`);
  const pc5 = await alice.c.call("POST", "/task/create", { title: "no assignee", description: "", priority: "low", project_id: p1, workspace_id: w1 });
  check("task with no assignee can be created", pc5.status === 201, `status=${pc5.status}`);

  const memberWs = await wsConnect(alice.c.cookie, w1);
  await alice.c.call("POST", "/task/create", { title: "ws-member-probe", description: "", priority: "low", project_id: p1, assigned_user_id: alice.id, workspace_id: w1 });
  await sleep(500);
  const got = memberWs.events.filter((e) => e.event === "task_created");
  check("WebSocket: workspace member DOES receive task_created", got.length === 1, `task_created events=${got.length}`);
  memberWs.ws.close();

  // 9. DELETE with no body must succeed cleanly (Express 5: req.body is undefined)
  const t2 = (await alice.c.call("POST", "/task/create", { title: "to delete", description: "", priority: "low", project_id: p1, assigned_user_id: alice.id, workspace_id: w1 })).json.data.id;
  const r9 = await alice.c.call("DELETE", `/task/${t2}`);
  const still = (await alice.c.call("GET", `/task/${t2}`)).status;
  check("DELETE /task/:id without a body returns 200", r9.status === 200, `status=${r9.status}; task actually deleted=${still === 404}`);

  // 10. logout exists and clears the cookie
  const r10 = await alice.c.call("POST", "/auth/logout");
  const cleared = r10.setCookie.some((c) => c.startsWith("token=") && /(expires=|max-age=0)/i.test(c));
  check("POST /auth/logout clears the auth cookie", r10.status === 200 && cleared, `status=${r10.status} clearedCookie=${cleared}`);

  // 11. password hash must not be written to server logs
  if (SERVER_LOG) {
    const log = readFileSync(SERVER_LOG, "utf8");
    check("server log contains no password hashes", !/password_hash|\$2[aby]\$/.test(log), "scanned " + SERVER_LOG);
  } else console.log("SKIP  log check (set SERVER_LOG)");

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
};

main().catch((e) => { console.error("harness error:", e); process.exit(2); });
