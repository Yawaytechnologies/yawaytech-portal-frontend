// src/redux/services/monitoringService.js

/** Resolve API base: localStorage override -> window global -> Vite env */
export function getApiBase() {
  // 1) Runtime override (if you ever set it from UI)
  const fromLS =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("ytp.apiBase")) ||
    "";
  if (fromLS.trim()) return fromLS.replace(/\/+$/, "");

  // 2) Window global (optional)
  const fromWin =
    typeof window !== "undefined" && typeof window.__API_BASE === "string"
      ? window.__API_BASE
      : "";
  if ((fromWin || "").trim()) return fromWin.replace(/\/+$/, "");

  // 3) Vite env – use SAME var as rest of app, with fallback
  const fromEnv = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    ""
  ).trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  // 4) Nothing configured
  return "";
}

export function setApiBase(url) {
  const clean = (url || "").trim().replace(/\/+$/, "");
  if (clean) {
    localStorage.setItem("ytp.apiBase", clean);
  } else {
    localStorage.removeItem("ytp.apiBase");
  }
}

/** Simple timeout wrapper */
async function fetchWithTimeout(url, options = {}, ms = 10000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctl.signal });
  } finally {
    clearTimeout(t);
  }
}

/** Auth header (optional) */
async function authHeaders() {
  const t = localStorage.getItem("auth.token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Normalize one snapshot row */
function normalizeSnapshot(row = {}) {
  const appsRaw = Array.isArray(row.active_apps) ? row.active_apps : [];
  const apps = appsRaw.map((a) => String(a || "")).filter(Boolean);

  const sitesRaw = Array.isArray(row.visited_sites) ? row.visited_sites : [];
  const sites = sitesRaw.map((s) => {
    const url = String(s?.url || "");
    let host = "—";
    if (url) {
      try {
        host = new URL(url).hostname || "—";
      } catch {
        host = "—";
      }
    }
    return {
      url,
      host: host.toLowerCase(),
      title: s?.title || host || "—",
      visited_at: s?.visited_at || null,
    };
  });

  return {
    id: row.id,
    session_id: row.session_id ?? null,
    monitored_at_utc: row.monitored_at_utc,
    cpu_percent: Number.isFinite(row.cpu_percent) ? row.cpu_percent : null,
    memory_percent: Number.isFinite(row.memory_percent)
      ? row.memory_percent
      : null,
    active_apps: apps,
    visited_sites: sites,
  };
}

/** === Public API === */
export async function apiGetMonitoring(
  employeeId,
  { limit = 100, since, until } = {}
) {
  const API_BASE = getApiBase();
  if (!API_BASE) throw new Error("API base URL is not set");

  if (!employeeId) throw new Error("employeeId required");

  const qs = new URLSearchParams();
  if (limit) qs.set("limit", String(limit));
  if (since) qs.set("since", since);
  if (until) qs.set("until", until);

  // ✅ Correct backend path: GET /api/{employee_id}/monitoring
  const url = `${API_BASE}/api/${encodeURIComponent(employeeId)}/monitoring${
    qs.toString() ? `?${qs}` : ""
  }`;

  // (Optional) debug
  // console.log("Monitoring URL =>", url);

  const r = await fetchWithTimeout(
    url,
    { headers: { Accept: "application/json", ...(await authHeaders()) } },
    12000
  );

  if (!r.ok) {
    // surface proper HTTP error to slice / toast
    const text = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} – ${text || "monitoring fetch failed"}`);
  }

  const data = await r.json();
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    employee_id: data?.employee_id || employeeId,
    employee_name: data?.employee_name || "—",
    items: items.map(normalizeSnapshot),
  };
}
