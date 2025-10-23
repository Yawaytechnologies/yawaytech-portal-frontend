// src/pages/EmployeeWorklogPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FiMoreVertical } from "react-icons/fi";

/**
 * EmployeeWorklogPage.jsx (Dummy-data version with Task Status)
 * - Status options: TODO, IN_PROGRESS, DONE
 * - Removed "Feature" field entirely
 * - Uses localStorage per employee
 */

/* =========================
   Local storage helpers
========================= */
const LS_KEY = (empId) => `demo_worklogs_${empId}`;

function readLS(empId) {
  try {
    const raw = localStorage.getItem(LS_KEY(empId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeLS(empId, rows) {
  localStorage.setItem(LS_KEY(empId), JSON.stringify(rows));
}

/* =========================
   Seed data (first run)
========================= */
function ensureSeed(empId) {
  const existing = readLS(empId);
  if (existing && Array.isArray(existing)) return existing;

  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  const seed = [
    {
      id: 1,
      employee_id: empId,
      work_date: today,
      task: "Set up project skeleton",
      description: "Initialized Vite + React app, basic layout, and Tailwind.",
      status: "DONE",
      start_time: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      duration_hours: 2,
      created_at: new Date(now - 3.5 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      employee_id: empId,
      work_date: today,
      task: "Build login screen",
      description: "Form, validation, and route guards.",
      status: "IN_PROGRESS",
      start_time: new Date(now - 30 * 60 * 1000).toISOString(),
      end_time: `${today}T18:00:00`,
      duration_hours: Math.round((30 / 60) * 100) / 100, // 0.5h so far
      created_at: new Date(now - 35 * 60 * 1000).toISOString(),
      updated_at: new Date(now - 30 * 60 * 1000).toISOString(),
    },
  ];

  writeLS(empId, seed);
  return seed;
}

/* =========================
   Faux async service
========================= */
const WorklogService = {
  async listByEmployee(employeeId) {
    const rows = ensureSeed(employeeId);
    return Promise.resolve(rows);
  },
  async create(employeeId, payload) {
    const rows = readLS(employeeId) ?? [];
    const id = Date.now();
    const now = new Date().toISOString();
    const item = { id, created_at: now, updated_at: now, ...payload };
    const next = [item, ...rows];
    writeLS(employeeId, next);
    return Promise.resolve(item);
  },
  async patch(employeeId, id, patch) {
    const rows = readLS(employeeId) ?? [];
    const next = rows.map((r) =>
      r.id === id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r
    );
    writeLS(employeeId, next);
    return Promise.resolve(next.find((r) => r.id === id));
  },
  async checkIn(employeeId, id, isoString) {
    return this.patch(employeeId, id, { start_time: isoString, status: "IN_PROGRESS" });
  },
  async checkOut(employeeId, id, isoString) {
    const rows = readLS(employeeId) ?? [];
    const row = rows.find((r) => r.id === id);
    let duration_hours = row?.duration_hours ?? null;
    if (row?.start_time) {
      const s = new Date(row.start_time).getTime();
      const e = new Date(isoString).getTime();
      if (!Number.isNaN(s) && !Number.isNaN(e) && e > s) {
        duration_hours = Math.round(((e - s) / 36e5) * 100) / 100;
      }
    }
    return this.patch(employeeId, id, { end_time: isoString, status: "DONE", duration_hours });
  },
};

/* =========================
   Utils & UI helpers
========================= */
const pad = (n) => String(n).padStart(2, "0");
const todayYMD = () => new Date().toISOString().slice(0, 10);
const toIso = (dateStr, h, m) => `${dateStr}T${pad(h)}:${pad(m)}:00`;

function fmtDateTime(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(+dt)) return "";
  return dt.toLocaleString();
}
function fmtTime(iso) {
  if (!iso) return "";
  const m = String(iso).match(/T(\d{2}:\d{2})/);
  return m ? m[1] : "";
}
function hoursBetween(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0;
  const hrs = (e - s) / 36e5;
  return Math.round(hrs * 100) / 100;
}

/* Status chip */
function StatusPill({ value }) {
  const map = {
    TODO:
      "bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-[inset_0_1px_0_rgba(255,255,255,.6)]",
    IN_PROGRESS:
      "bg-amber-50 text-amber-900 border border-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,.6)]",
    DONE:
      "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-[inset_0_1px_0_rgba(255,255,255,.6)]",
  };
  const cls = map[value] || "bg-slate-100 text-slate-800 border border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {value}
    </span>
  );
}

/* =========================
   Modal primitive (themed)
========================= */
function Modal({ open, onClose, title, children, size = "md" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div
          className={[
            "w-[92vw] overflow-hidden rounded-2xl border border-indigo-200 shadow-2xl",
            size === "lg" ? "max-w-2xl" : "max-w-md",
          ].join(" ")}
        >
          <div className="bg-gradient-to-b from-white to-indigo-50">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
              <h3 className="text-base font-semibold">{title}</h3>
              <button onClick={onClose} className="rounded-full p-1 hover:bg-white/20" aria-label="Close">
                ✕
              </button>
            </div>
            <div className="p-5">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Add Worklog Modal (with Status)
========================= */
function AddWorklogModal({ open, onClose, onCreate, employeeId }) {
  const [form, setForm] = useState({
    title: "",
    status: "TODO",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Title is required");
    if (!form.description.trim()) return setError("Description is required");

    try {
      setLoading(true);

      // Autofill times to avoid visual blanks
      const dateStr = todayYMD();
      const now = new Date();
      let start_time = "";
      let end_time = "";
      let duration_hours = 0;

      if (form.status === "TODO") {
        start_time = toIso(dateStr, 9, 30);
        end_time = toIso(dateStr, 18, 0);
        duration_hours = 0;
      } else if (form.status === "IN_PROGRESS") {
        const start = new Date(now.getTime() - 60 * 60 * 1000); // now - 1h
        start_time = start.toISOString();
        end_time = toIso(dateStr, 18, 0);
        duration_hours = Math.max(0, Math.round(((now - start) / 36e5) * 100) / 100);
      } else {
        // DONE
        const start = new Date(now.getTime() - 8 * 60 * 60 * 1000);
        start_time = start.toISOString();
        end_time = now.toISOString();
        duration_hours = 8;
      }

      const payload = {
        employee_id: employeeId,
        task: form.title.trim(),
        description: form.description.trim(),
        work_date: dateStr,
        status: form.status,
        start_time,
        end_time,
        duration_hours,
      };

      const created = await WorklogService.create(employeeId, payload);
      onCreate?.(created);
      onClose();
      setForm({ title: "", status: "TODO", description: "" });
    } catch (err) {
      setError(err.message || "Failed to create worklog");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Worklog" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-indigo-500"
            placeholder="e.g., Implement login flow"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Task Status</label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-indigo-500"
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="min-h-[110px] w-full resize-y rounded-lg border border-slate-300 p-2 outline-none focus:border-indigo-500"
            placeholder="Briefly explain the work you'll do"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================
   Row Manage Modal
========================= */
function RowManageModal({ open, onClose, worklog, onUpdate, employeeId }) {
  const [busy, setBusy] = useState(false);
  const hasStart = Boolean(worklog?.start_time);
  const hasEnd = Boolean(worklog?.end_time);

  async function doCheckIn() {
    try {
      setBusy(true);
      const now = new Date().toISOString();
      const updated = await WorklogService.checkIn(employeeId, worklog.id, now);
      onUpdate?.(updated ?? { ...worklog, start_time: now, status: "IN_PROGRESS" });
      onClose();
    } catch (e) {
      alert(e.message || "Failed to check in");
    } finally {
      setBusy(false);
    }
  }
  async function doCheckOut() {
    try {
      setBusy(true);
      const now = new Date().toISOString();
      const updated = await WorklogService.checkOut(employeeId, worklog.id, now);
      onUpdate?.(updated ?? { ...worklog, end_time: now, status: "DONE", duration_hours: hoursBetween(worklog.start_time, now) });
      onClose();
    } catch (e) {
      alert(e.message || "Failed to check out");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Manage Worklog #${worklog?.id || ""}`}>
      <div className="space-y-4">
        <div className="rounded-lg border border-indigo-100 bg-white/80 p-3">
          <div className="text-sm text-slate-500">Title</div>
          <div className="font-medium text-slate-900">{worklog?.task}</div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-500">Status</div>
              <div className="font-medium"><StatusPill value={worklog?.status || "TODO"} /></div>
            </div>
            <div>
              <div className="text-slate-500">Date</div>
              <div className="font-medium">{worklog?.work_date}</div>
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-700">{worklog?.description}</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-indigo-100 bg-white/80 p-3">
            <div className="text-xs text-slate-500">Check In</div>
            <div className="font-medium">{fmtDateTime(worklog?.start_time)}</div>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-white/80 p-3">
            <div className="text-xs text-slate-500">Check Out</div>
            <div className="font-medium">{fmtDateTime(worklog?.end_time)}</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            onClick={doCheckIn}
            disabled={busy || hasStart}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {hasStart ? "Checked In" : busy ? "Checking In..." : "Check In"}
          </button>
          <button
            onClick={doCheckOut}
            disabled={busy || !hasStart || hasEnd}
            className="rounded-lg bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {hasEnd ? "Checked Out" : busy ? "Checking Out..." : "Check Out"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* =========================
   Main Page
========================= */
export default function EmployeeWorklogPage({ employeeId: propEmployeeId }) {
  const employeeId = propEmployeeId || "YTPL00027";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await WorklogService.listByEmployee(employeeId);
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Failed to load worklogs");
      } finally {
        setLoading(false);
      }
    })();
  }, [employeeId]);

  function onCreated(newItem) {
    setRows((r) => [newItem, ...r]);
  }
  function onUpdated(updated) {
    if (!updated?.id) return;
    setRows((r) => r.map((it) => (it.id === updated.id ? { ...it, ...updated } : it)));
  }

  const columns = useMemo(
    () => [
      {
        key: "work_date",
        label: "Date",
        render: (r) => r.work_date || new Date(r.created_at || Date.now()).toISOString().slice(0, 10),
      },
      { key: "task", label: "Title" },
      {
        key: "status",
        label: "Task Status",
        render: (r) => <StatusPill value={r.status || "TODO"} />,
      },
      { key: "start_time", label: "Check In", render: (r) => fmtTime(r.start_time) },
      { key: "end_time", label: "Check Out", render: (r) => fmtTime(r.end_time) },
      {
        key: "duration_hours",
        label: "Duration (h)",
        render: (r) => (Number.isFinite(r.duration_hours) ? r.duration_hours : hoursBetween(r.start_time, r.end_time)).toFixed(2),
      },
    ],
    []
  );

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 bg-[#eef2ff] min-h-screen">
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Worklog</h1>
          <p className="text-slate-600 text-sm">Track your daily work and record check-in/out times.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          + Add Worklog
        </button>
      </div>

      {/* Content card (premium table) */}
      <div className="rounded-3xl border border-indigo-200/70 bg-white/90 shadow-[0_12px_40px_-12px_rgba(30,41,59,0.25)]">
        {loading ? (
          <div className="p-6 text-center text-slate-600">Loading worklogs…</div>
        ) : error ? (
          <div className="m-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-slate-600">No worklogs yet. Click “Add Worklog”.</div>
        ) : (
          <div className="p-4">
            <div className="overflow-hidden rounded-2xl border border-indigo-100 ring-1 ring-indigo-100/70">
              <table className="min-w-full table-fixed text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white/95">
                    {columns.map((c) => (
                      <th key={c.key} className="px-4 py-3 text-left text-[13px] font-semibold">
                        {c.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-[13px] font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`align-middle transition-colors ${
                        i % 2 ? "bg-indigo-50/40" : "bg-white"
                      } hover:bg-indigo-100/40`}
                    >
                      {columns.map((c) => (
                        <td key={c.key} className="px-4 py-3 text-slate-900">
                          {c.render ? c.render(r) : r[c.key] || ""}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          aria-label="Manage worklog"
                          className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-indigo-700 shadow-sm hover:bg-indigo-50"
                          onClick={() => {
                            setSelectedRow(r);
                            setManageOpen(true);
                          }}
                          title="Manage (Check In / Check Out)"
                        >
                          <FiMoreVertical />
                          <span className="hidden sm:inline">Manage</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-indigo-700/60">
              Demo data (localStorage) • times auto-filled based on status
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddWorklogModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={onCreated}
        employeeId={employeeId}
      />

      {selectedRow && (
        <RowManageModal
          open={manageOpen}
          onClose={() => setManageOpen(false)}
          worklog={selectedRow}
          onUpdate={onUpdated}
          employeeId={employeeId}
        />
      )}
    </div>
  );
}
