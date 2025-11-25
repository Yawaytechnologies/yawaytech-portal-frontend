// src/pages/EmployeeWorklog.jsx
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast, Slide } from "react-toastify";

// Thunk
import { fetchWorklogsByEmployee } from "../redux/actions/worklogActions";

// Slice
import {
  selectWorklogItems,
  selectWorklogLoading,
  selectWorklogError,
  selectWorklogFilters,
  selectWorklogTotal,
  setWorklogFilters,
} from "../redux/reducer/worklogSlice";

/* 🔔 Toastify pill config (similar to AdminLogin) */
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {v}
    </span>
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
      toast(msg, {
        ...TOAST_BASE,
        style: STYLE_ERROR,
        icon: false,
      });
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
            Employee Worklog
          </h1>
          <p className="text-sm text-slate-600">
            Employee: <span className="font-semibold">{employeeId}</span>
          </p>
        </div>

        {/* Filters (forced light theme so they are visible) */}
        <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 gap-2 md:flex md:flex-row md:items-center">
          <select
            className="w-full rounded-lg bg-white text-slate-800 border border-slate-300 ring-1 ring-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2 text-sm shadow-sm hover:bg-white"
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
            className="w-full rounded-lg bg-white text-slate-800 border border-slate-300 ring-1 ring-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2 text-sm shadow-sm hover:bg-white"
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

      {/* Table / Cards */}
      <div className="rounded-3xl border border-indigo-200/70 bg-white/90 shadow">
        {loading ? (
          <div className="p-6 text-center text-slate-600">Loading…</div>
        ) : error ? (
          <div className="m-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-slate-600">
            No worklogs found.
          </div>
        ) : (
          <div className="p-4">
            {/* Desktop / Tablet */}
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
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const hours = calcHoursCtx(
                        r.start_time,
                        r.end_time,
                        r.work_date,
                        r.duration_hours
                      );
                      return (
                        <tr
                          key={r.id}
                          className={`align-middle transition-colors ${
                            i % 2 ? "bg-indigo-50/40" : "bg-white"
                          } hover:bg-indigo-100/40`}
                        >
                          <td className="px-4 py-3 text-slate-900">
                            {fmtDateIST(
                              r.work_date || r.start_time,
                              r.work_date
                            )}
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
                  r.duration_hours
                );
                return (
                  <div
                    key={r.id}
                    className="rounded-xl border border-indigo-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[12px] text-slate-500">
                          {fmtDateIST(r.work_date || r.start_time, r.work_date)}
                        </div>
                        <div className="mt-0.5 font-semibold text-slate-900 truncate">
                          {r.task || "—"}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[12px] text-slate-600">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                            {r.work_type || "-"}
                          </span>
                          <StatusPill value={r.status} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                      <div>
                        <div className="text-[11px] text-slate-500">
                          Check In (IST)
                        </div>
                        <div className="font-medium">
                          {fmtTimeIST(r.start_time, r.work_date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">
                          Check Out (IST)
                        </div>
                        <div className="font-medium">
                          {fmtTimeIST(r.end_time, r.work_date)}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[11px] text-slate-500">
                          Duration (h)
                        </div>
                        <div className="font-medium">
                          {Number.isFinite(hours) ? hours.toFixed(2) : "0.00"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-indigo-700/60">
              IST time zone • totals reflect filtered rows.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
