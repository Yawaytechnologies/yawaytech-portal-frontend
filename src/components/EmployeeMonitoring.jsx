// src/pages/MonitoringViewer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Monitoring,
  setEmployeeId as setEmployeeIdStore,
  setLimit as setLimitStore,
  setSince as setSinceStore,
  setUntil as setUntilStore,
} from "../redux/reducer/monitoringSlice";
import { fetchMonitoring } from "../redux/actions/monitoringActions";
import { getApiBase, setApiBase } from "../redux/services/monitoringService";

/* ===== Brand palette (unchanged tokens) ===== */
const ACCENT_BLUE = "#005BAC";
const ACCENT_ORANGE = "#FF5800";

/* ===== UI tokens (light theme, card style) ===== */
const UI = {
  card: "rounded-xl bg-white border border-slate-200 shadow-sm",
  headerCard: "rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden",
  label: "text-[11px] font-semibold tracking-wide text-slate-500 uppercase",
  input:
    "px-3.5 py-2.5 rounded-lg bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-slate-400",
  btnPrimary:
    "px-4 py-2.5 rounded-lg bg-[#FF5800] text-white font-medium shadow-sm hover:brightness-110 active:scale-[.99] transition",
  btnSecondary:
    "px-4 py-2.5 rounded-lg bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 active:scale-[.99] transition",
  chip: "px-2.5 py-1 rounded-full text-[12px] bg-slate-100 text-slate-700 border border-slate-200",
  kpiTitle: "text-[12px] font-medium text-slate-500",
  kpiValue: "text-lg font-semibold text-slate-900",
};
 const _cx = (...xs) => xs.filter(Boolean).join(" ");

export default function MonitoringViewer() {
  const dispatch = useDispatch();
  const { employeeId, limit, since, until, data, status, error } = useSelector(Monitoring);

  // ---------- Local form state ----------
  const [empId, setEmpId] = useState((employeeId || "").toUpperCase());
  const [limitLocal, setLimitLocal] = useState(limit || 100);
  const [sinceLocal, setSinceLocal] = useState(since || "");
  const [untilLocal, setUntilLocal] = useState(until || "");

  // API base runtime editor
  const [apiBase, setApiBaseLocal] = useState(getApiBase());
  const [showApiBar, setShowApiBar] = useState(!getApiBase());
  const [apiError, setApiError] = useState("");

  const empInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", ACCENT_ORANGE);
  }, []);

  // Prefill employee ID
  useEffect(() => {
    const last = localStorage.getItem("ytp_employee_id") || "YTP000007";
    const initial = (employeeId || empId || last).toUpperCase();
    setEmpId(initial);
    if (empInputRef.current) empInputRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync down from store if it changes elsewhere
  useEffect(() => {
    if (employeeId) setEmpId(employeeId.toUpperCase());
  }, [employeeId]);
  useEffect(() => {
    if (limit) setLimitLocal(limit);
  }, [limit]);
  useEffect(() => {
    if (since) setSinceLocal(since);
  }, [since]);
  useEffect(() => {
    if (until) setUntilLocal(until);
  }, [until]);

  // Normalize & fetch
  const onFetch = () => {
    if (!getApiBase()) {
      setApiError("VITE_API_URL is not set — provide an API Base below.");
      setShowApiBar(true);
      return;
    }
    const id = (empId || "").trim().toUpperCase();
    if (!id) return;

    localStorage.setItem("ytp_employee_id", id);

    dispatch(setEmployeeIdStore(id));
    dispatch(setLimitStore(limitLocal || 1));
    dispatch(setSinceStore(sinceLocal || ""));
    dispatch(setUntilStore(untilLocal || ""));

    dispatch(
      fetchMonitoring({
        employeeId: id,
        limit: limitLocal || 100,
        since: sinceLocal || undefined,
        until: untilLocal || undefined,
      })
    );
  };

  // Keyboard shortcuts
  const onKeyDown = (e) => {
    if (e.key === "Enter" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter")) {
      onFetch();
    }
  };

  // Uppercase while typing (cursor-safe)
  const onEmpIdChange = (v) => setEmpId(v.toUpperCase());
  const onEmpIdBlur = () => setEmpId((empId || "").trim().toUpperCase());

  // Save API Base (runtime)
  const saveApiBase = () => {
    try {
      const url = (apiBase || "").trim();
      if (!url) throw new Error("Please enter a URL (e.g., https://your-backend.example.com)");
      new URL(url);
      setApiBase(url); // persist to localStorage
      setApiError("");
      setShowApiBar(false);
    } catch (e) {
      setApiError(e.message || "Invalid URL");
    }
  };

  // Data shaping
  const items = data?.items || [];
  const newest = items[0];

  const aggApps = useMemo(() => {
    const map = new Map();
    for (const it of items) (it.active_apps || []).forEach((a) => map.set(a, (map.get(a) || 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [items]);

  const aggSites = useMemo(() => {
    const map = new Map();
    for (const it of items)
      (it.visited_sites || []).forEach((s) => {
        const key = s.host || s.title || "—";
        map.set(key, (map.get(key) || 0) + 1);
      });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [items]);

  const noApi = !getApiBase();

  return (
    <div className="p-6 space-y-6">
      {/* API Base bar */}
      {showApiBar && (
        <div className={UI.card}>
          <div className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col flex-1 min-w-[260px]">
                <label className={UI.label}>API Base URL</label>
                <input
                  className={UI.input}
                  placeholder="https://yawaytech-portal-backend-python-2.onrender.com"
                  value={apiBase}
                  onChange={(e) => setApiBaseLocal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveApiBase()}
                />
              </div>
              <button onClick={saveApiBase} className={UI.btnPrimary}>
                Save
              </button>
              <button onClick={() => setShowApiBar(false)} className={UI.btnSecondary}>
                Close
              </button>
            </div>
            {apiError && <div className="mt-2 text-sm text-rose-600">Error: {apiError}</div>}
            {!apiError && noApi && (
              <div className="mt-2 text-sm text-rose-600">Error: VITE_API_URL is not set</div>
            )}
          </div>
        </div>
      )}

      {/* Header / Controls */}
      <div className={UI.headerCard}>
        <div
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ background: `linear-gradient(90deg, ${ACCENT_ORANGE}, ${ACCENT_BLUE})` }}
        />
        <div className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Monitoring Viewer</h1>
              
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col">
                <label className={UI.label}>Employee ID</label>
                <input
                  ref={empInputRef}
                  className={UI.input}
                  placeholder="YTP000007"
                  value={empId}
                  onChange={(e) => onEmpIdChange(e.target.value)}
                  onBlur={onEmpIdBlur}
                  onKeyDown={onKeyDown}
                />
              </div>

              <div className="flex flex-col">
                <label className={UI.label}>Limit</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  className={`${UI.input} w-28`}
                  value={limitLocal}
                  onChange={(e) =>
                    setLimitLocal(Math.min(500, Math.max(1, Number(e.target.value) || 1)))
                  }
                  onKeyDown={onKeyDown}
                  title="Number of snapshots"
                />
              </div>

              <div className="flex flex-col">
                <label className={UI.label}>Since (UTC)</label>
                <input
                  type="datetime-local"
                  className={UI.input}
                  value={sinceLocal}
                  onChange={(e) => setSinceLocal(e.target.value)}
                  onKeyDown={onKeyDown}
                />
              </div>

              <div className="flex flex-col">
                <label className={UI.label}>Until (UTC)</label>
                <input
                  type="datetime-local"
                  className={UI.input}
                  value={untilLocal}
                  onChange={(e) => setUntilLocal(e.target.value)}
                  onKeyDown={onKeyDown}
                />
              </div>

              <button onClick={onFetch} className={UI.btnPrimary} title="Fetch (Enter or Ctrl/Cmd+Enter)">
                Fetch
              </button>

              <button onClick={() => setShowApiBar((v) => !v)} className={UI.btnSecondary} title="Change API Base">
                {showApiBar ? "Hide API" : "Change API"}
              </button>
            </div>
          </div>

          {/* status line + KPIs */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="text-sm">
              {status === "loading" && <span className="text-slate-500">Loading…</span>}
              {status === "failed" && <span className="text-rose-600">Error: {error}</span>}
              {status === "succeeded" && (
                <span className="text-slate-600">
                  {data?.employee_name ? (
                    <span className="text-slate-900">{data.employee_name}</span>
                  ) : (
                    "Unknown User"
                  )}{" "}
                  — <span className="text-slate-900">{data?.employee_id}</span> •{" "}
                  <span className="text-slate-900">{(data?.items || []).length}</span> snapshots
                </span>
              )}
              {!showApiBar && noApi && (
                <div className="text-rose-600 mt-1">Error: VITE_API_URL is not set</div>
              )}
            </div>

            {newest && (
              <div className="ml-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className={UI.kpiTitle}>CPU</div>
                  <div className={UI.kpiValue}>{newest.cpu_percent ?? "—"}%</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className={UI.kpiTitle}>RAM</div>
                  <div className={UI.kpiValue}>{newest.memory_percent ?? "—"}%</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hidden sm:block">
                  <div className={UI.kpiTitle}>Apps</div>
                  <div className={UI.kpiValue}>{(newest.active_apps || []).length || "—"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Latest Snapshot */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className={UI.card}>
          <div className="p-4">
            <div className="text-sm font-semibold text-slate-900 mb-2">Latest Snapshot</div>
            {status === "loading" ? (
              <div className="h-6 w-full bg-slate-100 animate-pulse rounded" />
            ) : newest ? (
              <div className="space-y-2 text-slate-700">
                <div className="text-[13px]">
                  at <span className="font-mono text-slate-900">{newest.monitored_at_utc}</span>
                </div>
                <div>
                  CPU: <span className="font-semibold text-slate-900">{newest.cpu_percent ?? "—"}%</span>
                </div>
                <div>
                  RAM: <span className="font-semibold text-slate-900">{newest.memory_percent ?? "—"}%</span>
                </div>

                <div className="mt-2">
                  <div className={`${UI.label} mb-1`}>Active Apps</div>
                  <div className="flex flex-wrap gap-2">
                    {(newest.active_apps || []).length ? (
                      newest.active_apps.map((a) => <span key={a} className={UI.chip}>{a}</span>)
                    ) : (
                      <span className="text-slate-400 text-sm">None</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No data</div>
            )}
          </div>
        </div>

        {/* Top Apps */}
        <div className={UI.card}>
          <div className="p-4">
            <div className="text-sm font-semibold text-slate-900 mb-2">Top Apps (count)</div>
            {aggApps.length ? (
              <div className="space-y-2">
                {aggApps.map(([name, cnt]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className={UI.chip}>{name}</span>
                    <span className="text-slate-600 text-sm">× {cnt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No apps</div>
            )}
          </div>
        </div>

        {/* Top Sites */}
        <div className={UI.card}>
          <div className="p-4">
            <div className="text-sm font-semibold text-slate-900 mb-2">Top Sites (count)</div>
            {aggSites.length ? (
              <div className="space-y-2">
                {aggSites.map(([host, cnt]) => (
                  <div key={host} className="flex items-center gap-2">
                    <span className={UI.chip}>{host}</span>
                    <span className="text-slate-600 text-sm">× {cnt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No sites</div>
            )}
          </div>
        </div>
      </div>

      {/* Snapshot table */}
      <div className={UI.card}>
        <div className="p-4">
          <div className="text-sm font-semibold text-slate-900 mb-3">Snapshots</div>
          <div className="overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 sticky top-0">
                <tr className="[&>th]:py-2.5 [&>th]:px-3 text-left">
                  <th>Time (UTC)</th>
                  <th className="text-right">CPU%</th>
                  <th className="text-right">RAM%</th>
                  <th>Apps</th>
                  <th>Visited Sites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.length ? (
                  items.map((it, i) => (
                    <tr key={it.id} className={i % 2 ? "bg-white" : "bg-slate-50/60"}>
                      <td className="py-2.5 px-3 text-slate-900 font-mono">{it.monitored_at_utc}</td>
                      <td className="py-2.5 px-3 text-right text-slate-900">{it.cpu_percent ?? "—"}</td>
                      <td className="py-2.5 px-3 text-right text-slate-900">{it.memory_percent ?? "—"}</td>
                      <td className="py-2.5 px-3 text-slate-900">
                        {(it.active_apps || []).length ? it.active_apps.join(", ") : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900">
                        {(it.visited_sites || []).length ? (
                          <div className="space-y-1">
                            {it.visited_sites.map((s, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-slate-600">{s.host}</span>
                                {s.url ? (
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline decoration-slate-400 hover:decoration-slate-700 truncate"
                                    title={s.title}
                                  >
                                    {s.title}
                                  </a>
                                ) : (
                                  <span className="truncate">{s.title}</span>
                                )}
                                <span className="ml-auto text-xs text-slate-500">
                                  {s.visited_at ? new Date(s.visited_at).toLocaleString() : "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3 px-3 text-slate-600" colSpan={5}>
                      {status === "loading" ? "Loading…" : "No data"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
