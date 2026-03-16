// src/pages/EmployeeWorklog.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast, Slide } from "react-toastify";

import {
  fetchWorklogsByEmployee,
  createWorklog,
} from "../redux/actions/worklogActions";

import {
  selectWorklogItems,
  selectWorklogLoading,
  selectWorklogError,
  selectWorklogFilters,
  selectWorklogTotal,
  setWorklogFilters,
} from "../redux/reducer/worklogSlice";

/* 🔔 Toastify pill config */
const TOAST_BASE = {
  position: "top-center",
  transition: Slide,
  autoClose: 1800,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
};

const PILL = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  width: "auto",
  maxWidth: "min(72vw, 260px)",
  padding: "5px 9px",
  lineHeight: 1.2,
  minHeight: 0,
  borderRadius: "10px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
  fontSize: "0.80rem",
  fontWeight: 600,
};

const STYLE_ERROR = {
  ...PILL,
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
};

/* ===== Date/Time helpers (IST) ===== */
const IST = "Asia/Kolkata";
const todayStr = () => new Date().toISOString().slice(0, 10);
const isTimeOnly = (s) => /^\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?$/.test(s || "");
const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
const hasTZ = (s) => /[zZ]|[+-]\d{2}:?\d{2}$/.test(s || "");
const ensureT = (s) => s.replace(" ", "T");
const joinDateTime = (dateStr, timeStr) =>
  `${dateStr || todayStr()}T${(timeStr || "").trim()}`;

const parseSmart = (value, dateCtx) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(+value) ? null : value;

  let s = String(value).trim();
  if (!s) return null;

  if (isTimeOnly(s)) s = joinDateTime(dateCtx || todayStr(), s);
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) s = ensureT(s);
  if (isDateOnly(s)) s = `${s}T00:00:00Z`;
  if (s.includes("T") && !hasTZ(s)) s = s + "Z";

  const d = new Date(s);
  return isNaN(+d) ? null : d;
};

const fmtDateIST = (value, dateCtx) => {
  if (typeof value === "string" && isDateOnly(value)) {
    return new Date(value + "T00:00:00Z").toLocaleDateString("en-IN", {
      timeZone: IST,
    });
  }
  const d = parseSmart(value, dateCtx);
  return d ? d.toLocaleDateString("en-IN", { timeZone: IST }) : "—";
};

const fmtTimeIST = (value, dateCtx) => {
  const d = parseSmart(value, dateCtx);
  return d
    ? d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: IST,
      })
    : "—";
};

const calcHoursCtx = (start, end, dateCtx, serverVal) => {
  if (typeof serverVal === "number" && isFinite(serverVal)) return serverVal;
  const s = parseSmart(start, dateCtx);
  const e = parseSmart(end, dateCtx);
  if (!s || !e || e <= s) return 0;
  return +((e - s) / 36e5).toFixed(2);
};

function StatusPill({ value }) {
  const v = value || "TODO";
  const cls =
    v === "DONE"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : v === "IN_PROGRESS"
        ? "bg-amber-50 text-amber-800 border border-amber-200"
        : "bg-indigo-50 text-indigo-800 border border-indigo-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      {v}
    </span>
  );
}

/* ===== Modal ===== */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      {/* Hide scrollbar (scroll works, but bar not visible) */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* shift away from sidebar on md+ */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-3 sm:p-4 md:pl-72">
        <div className="w-[92vw] md:w-[calc(100vw-18rem-2rem)] max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-indigo-200 shadow-2xl flex flex-col">
          <div className="bg-gradient-to-b from-white to-indigo-50 flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
              {/* ✅ smaller title */}
              <h3 className="text-sm font-semibold">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-white/20"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* ✅ smaller modal content + hide scrollbar */}
            <div className="p-5 overflow-y-auto flex-1 no-scrollbar text-[13px]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      {/* ✅ smaller */}
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-[13px] font-semibold text-slate-900">
        {String(value)}
      </div>
    </div>
  );
}

/* ✅ View-only modal */
function ViewWorklogModal({ open, onClose, row }) {
  if (!row) return null;

  const hours = calcHoursCtx(
    row.start_time,
    row.end_time,
    row.work_date,
    row.duration_hours,
  );

  return (
    <Modal open={open} onClose={onClose} title={`View: ${row.task || "Worklog"}`}>
      <div className="space-y-4">
        {/* Summary */}
        <div className="rounded-2xl border border-indigo-100 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-500">Title</div>
              <div className="text-sm font-semibold text-slate-900">
                {row.task || "—"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[11px] text-slate-500">Status</div>
              <StatusPill value={row.status || "TODO"} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Info label="Employee" value={row.employee_id || "—"} />
            <Info label="Date" value={row.work_date || "—"} />
            <Info label="Work Type" value={row.work_type || "—"} />
            <Info
              label="Duration (h)"
              value={Number.isFinite(hours) ? hours.toFixed(2) : "0.00"}
            />
          </div>
        </div>

        {/* Times */}
        <div className="rounded-2xl border border-indigo-100 bg-white p-4">
          {/* ✅ smaller heading */}
          <div className="text-xs font-semibold text-slate-900 mb-3">
            Times (IST)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Info
              label="Start Time"
              value={fmtTimeIST(row.start_time, row.work_date)}
            />
            <Info
              label="End Time"
              value={fmtTimeIST(row.end_time, row.work_date)}
            />
          </div>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-indigo-100 bg-white p-4">
          {/* ✅ smaller heading */}
          <div className="text-xs font-semibold text-slate-900 mb-2">
            Description
          </div>
          {/* ✅ smaller body */}
          <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {row.description || "—"}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ===== Component ===== */
export default function EmployeeWorklog() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const rowsAll = useSelector(selectWorklogItems);
  const loading = useSelector(selectWorklogLoading);
  const error = useSelector(selectWorklogError);
  const filters = useSelector(selectWorklogFilters);
  const totals = useSelector(selectWorklogTotal);

  const [form, setForm] = useState({
    work_date: todayStr(),
    work_type: "Feature",
    status: "TODO",
    task: "",
    description: "",
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!filters || typeof filters !== "object") {
      dispatch(setWorklogFilters({ type: "ALL", status: "ALL" }));
    }
  }, [dispatch, filters]);

  useEffect(() => {
    if (!employeeId) return;
    dispatch(fetchWorklogsByEmployee({ employeeId }));
  }, [dispatch, employeeId]);

  useEffect(() => {
    if (error) {
      const msg =
        typeof error === "string"
          ? error
          : error?.message || "Failed to load worklogs. Please try again.";
      toast(msg, { ...TOAST_BASE, style: STYLE_ERROR, icon: false });
    }
  }, [error]);

  const rows = useMemo(() => {
    const type = filters?.type ?? "ALL";
    const status = filters?.status ?? "ALL";
    return (rowsAll || []).filter((r) => {
      const byType = type === "ALL" || r.work_type === type;
      const byStatus = status === "ALL" || r.status === status;
      return byType && byStatus;
    });
  }, [rowsAll, filters]);

  const selectedRow = useMemo(
    () => (rowsAll || []).find((r) => r.id === selectedId) || null,
    [rowsAll, selectedId],
  );

  const handleAddWork = async (e) => {
    e.preventDefault();
    if (!employeeId) return;

    const payload = {
      employee_id: employeeId,
      work_date: form.work_date,
      work_type: form.work_type,
      status: form.status,
      task: form.task?.trim(),
      description: form.description?.trim(),
    };

    if (!payload.task || !payload.description) return;

    try {
      await dispatch(createWorklog(payload));
      setForm((f) => ({ ...f, task: "", description: "" }));
      dispatch(fetchWorklogsByEmployee({ employeeId }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 bg-[#eef2ff] min-h-screen">
      {/* Header + filters */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-[#FF5800] underline hover:opacity-80"
          >
            ← Back
          </button>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Employee Work
          </h1>
          <p className="text-sm text-slate-600">
            Employee: <span className="font-semibold">{employeeId}</span>
          </p>
        </div>

        <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 gap-2 md:flex md:flex-row md:items-center">
          <select
            className="rounded-lg bg-white text-slate-900 border border-slate-300 p-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters?.type ?? "ALL"}
            onChange={(e) =>
              dispatch(setWorklogFilters({ type: e.target.value }))
            }
          >
            <option value="ALL">All Types</option>
            <option value="Feature">Feature</option>
            <option value="Bug Fix">Bug Fix</option>
            <option value="Meeting">Meeting</option>
            <option value="Training">Training</option>
            <option value="Support">Support</option>
            <option value="Other">Other</option>
          </select>

          <select
            className="rounded-lg bg-white text-slate-900 border border-slate-300 p-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters?.status ?? "ALL"}
            onChange={(e) =>
              dispatch(setWorklogFilters({ status: e.target.value }))
            }
          >
            <option value="ALL">All Status</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </div>
      </div>

      {/* Totals */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-xl border border-indigo-200 bg-white p-3 text-center">
          <div className="text-xs text-slate-500">Entries</div>
          <div className="text-xl font-semibold text-slate-900">
            {totals?.count ?? rows.length}
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-white p-3 text-center">
          <div className="text-xs text-slate-500">Total Hours</div>
          <div className="text-xl font-semibold text-slate-900">
            {Number(totals?.duration ?? 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Create Work */}
      <div className="mb-6 rounded-2xl border border-indigo-200 bg-white/90 p-4 shadow">
        <form onSubmit={handleAddWork} className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-medium text-slate-900">
              Date
            </label>
            <input
              type="date"
              value={form.work_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, work_date: e.target.value }))
              }
              className="w-full rounded-lg bg-white text-slate-900 border border-slate-300 p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-medium text-slate-900">
              Work Type
            </label>
            <select
              value={form.work_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, work_type: e.target.value }))
              }
              className="w-full rounded-lg bg-white text-slate-900 border border-slate-300 p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Feature">Feature</option>
              <option value="Bug Fix">Bug Fix</option>
              <option value="Meeting">Meeting</option>
              <option value="Training">Training</option>
              <option value="Support">Support</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-medium text-slate-900">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
              className="w-full rounded-lg bg-white text-slate-900 border border-slate-300 p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium text-slate-900">
              Title
            </label>
            <input
              type="text"
              value={form.task}
              onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
              placeholder="e.g., Design Home Page"
              className="w-full rounded-lg bg-white text-slate-900 border border-slate-300 p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium text-slate-900">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Brief description…"
              className="w-full rounded-lg bg-white text-slate-900 border border-slate-300 p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-12 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Add Work"}
            </button>
          </div>
        </form>
      </div>

      {/* Table / Cards */}
      <div className="rounded-3xl border border-indigo-200/70 bg-white/90 shadow">
        {loading ? (
          <div className="p-6 text-center text-slate-600">Loading…</div>
        ) : error ? (
          <div className="m-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-slate-600">No worklogs found.</div>
        ) : (
          <div className="p-4">
            {/* Desktop */}
            <div className="hidden md:block">
              <div className="overflow-x-auto rounded-2xl border border-indigo-100">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white/95">
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">
                        Check In
                      </th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">
                        Check Out
                      </th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">
                        Duration (h)
                      </th>
                      <th className="px-4 py-3 text-right text-[13px] font-semibold whitespace-nowrap">
                        View
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((r, i) => {
                      const hours = calcHoursCtx(
                        r.start_time,
                        r.end_time,
                        r.work_date,
                        r.duration_hours,
                      );
                      return (
                        <tr
                          key={r.id}
                          className={`align-middle transition-colors ${
                            i % 2 ? "bg-indigo-50/40" : "bg-white"
                          } hover:bg-indigo-100/40`}
                        >
                          <td className="px-4 py-3 text-slate-900">
                            {fmtDateIST(r.work_date || r.start_time, r.work_date)}
                          </td>
                          <td className="px-4 py-3 text-slate-900">
                            {r.task || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-900">
                            {r.work_type || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-900">
                            <StatusPill value={r.status} />
                          </td>
                          <td className="px-4 py-3 text-slate-900">
                            {fmtTimeIST(r.start_time, r.work_date)}
                          </td>
                          <td className="px-4 py-3 text-slate-900">
                            {fmtTimeIST(r.end_time, r.work_date)}
                          </td>
                          <td className="px-4 py-3 text-slate-900">
                            {Number.isFinite(hours) ? hours.toFixed(2) : "0.00"}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedId(r.id);
                                setViewOpen(true);
                              }}
                              className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-indigo-700 shadow-sm hover:bg-indigo-50 text-[13px]"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {rows.map((r) => {
                const hours = calcHoursCtx(
                  r.start_time,
                  r.end_time,
                  r.work_date,
                  r.duration_hours,
                );
                return (
                  <div
                    key={r.id}
                    className="rounded-xl border border-indigo-100 bg-white p-3 shadow-sm"
                  >
                    <div className="text-[12px] text-slate-500">
                      {fmtDateIST(r.work_date || r.start_time, r.work_date)}
                    </div>
                    <div className="mt-0.5 font-semibold text-slate-900 truncate text-[13px]">
                      {r.task || "—"}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-slate-600">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                        {r.work_type || "-"}
                      </span>
                      <StatusPill value={r.status} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                      <div>
                        <div className="text-[11px] text-slate-500">
                          Check In (IST)
                        </div>
                        <div className="font-medium text-slate-900">
                          {fmtTimeIST(r.start_time, r.work_date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">
                          Check Out (IST)
                        </div>
                        <div className="font-medium text-slate-900">
                          {fmtTimeIST(r.end_time, r.work_date)}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[11px] text-slate-500">
                          Duration (h)
                        </div>
                        <div className="font-medium text-slate-900">
                          {Number.isFinite(hours) ? hours.toFixed(2) : "0.00"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedId(r.id);
                          setViewOpen(true);
                        }}
                        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

           
          </div>
        )}
      </div>

      {/* View Modal */}
      <ViewWorklogModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        row={selectedRow}
      />
    </div>
  );
}