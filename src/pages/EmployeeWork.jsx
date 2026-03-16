import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createWorklog,
  fetchWorklogsByEmployee,
  checkInWorklog,
  checkOutWorklog,
  updateWorklog,
  updateWorklogTimes,
  deleteWorklog,
} from "../redux/actions/worklogActions";

import {
  selectWorklogs,
  selectWorklogLoading,
  selectWorklogError,
  selectUpdatingId,
  selectWorklogFilters,
  selectWorklogTotal,
  setWorklogFilters,
} from "../redux/reducer/worklogSlice";

import { WorkType, WorklogStatus } from "../redux/services/worklogService";

/* ===================== Helpers ===================== */
const today = () => new Date().toISOString().slice(0, 10);
const ASSUME_SERVER_TIMES_ARE_UTC = true;

const joinDT = (dateStr, timeStr) => {
  if (!timeStr) return null;
  const s = String(timeStr).trim();

  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(s)) return s.replace(" ", "T");

  if (/^\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?$/.test(s)) {
    const d = dateStr || today();
    return `${d}T${s}`;
  }
  return s;
};

function parseDateSafe(value, dateCtx) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(+value) ? null : value;

  let v = value;

  if (typeof v === "string" && /^\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?$/.test(v)) {
    v = joinDT(dateCtx, v);
  }

  if (typeof v === "number") {
    const d = new Date(v);
    return isNaN(+d) ? null : d;
  }

  let s = String(v).trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00`);
    return isNaN(+d) ? null : d;
  }

  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    s = s.replace(" ", "T");
  }

  const isoNoTZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?$/;
  if (ASSUME_SERVER_TIMES_ARE_UTC && isoNoTZ.test(s)) {
    const dUtc = new Date(`${s}Z`);
    return isNaN(+dUtc) ? null : dUtc;
  }

  let d = new Date(s);
  if (!isNaN(+d)) return d;

  d = new Date(`${s}Z`);
  return isNaN(+d) ? null : d;
}

const fmtDateTimeIST = (value, dateCtx) => {
  const d = parseDateSafe(value, dateCtx);
  return d
    ? d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
};

const timeHM = (value, dateCtx) => {
  const d = parseDateSafe(value, dateCtx);
  return d
    ? d.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";
};

const durHrs = (start, end, dateCtx) => {
  const ds = parseDateSafe(start, dateCtx);
  const de = parseDateSafe(end, dateCtx);
  if (!ds || !de) return 0;
  const ms = de.getTime() - ds.getTime();
  if (ms <= 0 || !Number.isFinite(ms)) return 0;
  return Math.round((ms / 36e5) * 100) / 100;
};

// ✅ keep HH:mm (Swagger accepts "09:30")
const asHHMM = (t) => {
  const s = String(t || "").trim();
  if (!s) return "";
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5);
  return s;
};

// Convert server time to input[type=time] "HH:mm"
const toTimeInput = (value, dateCtx) => {
  const d = parseDateSafe(value, dateCtx);
  if (!d) return "";
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

function StatusPill({ value }) {
  const cls =
    value === "DONE"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : value === "IN_PROGRESS"
        ? "bg-amber-50 text-amber-800 border border-amber-200"
        : "bg-indigo-50 text-indigo-800 border border-indigo-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {value}
    </span>
  );
}

/* ===================== Modal primitives ===================== */
function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div
          className={`w-[92vw] ${wide ? "max-w-3xl" : "max-w-md"} overflow-hidden rounded-2xl border border-indigo-200 shadow-2xl`}
        >
          <div className="bg-gradient-to-b from-white to-indigo-50">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
              <h3 className="text-base font-semibold">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-white/20"
                aria-label="Close"
              >
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

/* Manage Modal */
function ManageWorklogModal({
  open,
  onClose,
  row,
  onCheckIn,
  onCheckOut,
  busy,
}) {
  if (!row) return null;
  const hasStart = !!row.start_time;
  const hasEnd = !!row.end_time;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Manage: ${row.task || "Worklog"}`}
      wide
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-indigo-100 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs text-slate-500">Employee</div>
              <div className="font-medium text-slate-900">
                {row.employee_id || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Date</div>
              <div className="font-medium text-slate-900">
                {row.work_date || "—"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500">Status</div>
              <StatusPill value={row.status || "TODO"} />
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-slate-500">Start Time</div>
              <div className="font-medium text-slate-900">
                {fmtDateTimeIST(row.start_time, row.work_date)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">End Time</div>
              <div className="font-medium text-slate-900">
                {fmtDateTimeIST(row.end_time, row.work_date)}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs text-slate-500">Description</div>
            <div className="text-sm text-slate-800 leading-relaxed">
              {row.description || "—"}
            </div>
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
            onClick={() => onCheckIn(row)}
            disabled={busy || hasStart}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {hasStart ? "Checked-In" : busy ? "Checking-In…" : "Check-In"}
          </button>

          <button
            onClick={() => onCheckOut(row)}
            disabled={busy || !hasStart || hasEnd}
            className="rounded-lg bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {hasEnd ? "Checked-Out" : busy ? "Checking-Out…" : "Check-Out"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* Edit Modal */
function EditWorklogModal({ open, onClose, row, onSave, busy }) {
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!open || !row) return;
    setDraft({
      work_date: row.work_date || today(),
      task: row.task || "",
      description: row.description || "",
      work_type: row.work_type || WorkType.FEATURE,
      status: row.status || WorklogStatus.TODO,
      start_time_hm: toTimeInput(row.start_time, row.work_date),
      end_time_hm: toTimeInput(row.end_time, row.work_date),
    });
  }, [open, row]);

  if (!row || !draft) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit: ${row.task || "Worklog"}`}
      wide
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium">Date</label>
            <input
              type="date"
              value={draft.work_date}
              onChange={(e) =>
                setDraft((d) => ({ ...d, work_date: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Status</label>
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft((d) => ({ ...d, status: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
            >
              {Object.values(WorklogStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Work Type</label>
            <select
              value={draft.work_type}
              onChange={(e) =>
                setDraft((d) => ({ ...d, work_type: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
            >
              {Object.values(WorkType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Title</label>
            <input
              type="text"
              value={draft.task}
              onChange={(e) =>
                setDraft((d) => ({ ...d, task: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium">
              Description
            </label>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Start Time</label>
            <input
              type="time"
              value={draft.start_time_hm}
              onChange={(e) =>
                setDraft((d) => ({ ...d, start_time_hm: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
            />
            <div className="mt-1 text-[11px] text-slate-500">
              Times update needs BOTH start and end.
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">End Time</label>
            <input
              type="time"
              value={draft.end_time_hm}
              onChange={(e) =>
                setDraft((d) => ({ ...d, end_time_hm: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(row, draft)}
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ===================== Employee ID resolver ===================== */
const selectAuthBits = (s) => ({
  a: s?.auth,
  u: s?.auth?.user,
  p: s?.auth?.profile,
});

const parseJSON = (v) => {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

const pullEmpId = (obj) => {
  if (!obj || typeof obj !== "object") return null;
  return (
    obj.employee_id ||
    obj.employeeId ||
    obj.emp_id ||
    obj.empId ||
    obj.code ||
    obj.employee_code ||
    obj.employeeCode ||
    null
  );
};

const jwtClaim = (token, key) => {
  try {
    const [, b64] = (token || "").split(".");
    if (!b64) return null;
    const json = JSON.parse(atob(b64.replace(/-/g, "+").replace(/_/g, "/")));
    return json?.[key] ?? null;
  } catch {
    return null;
  }
};

const sniffLocalStorageEmpId = () => {
  const structured = [
    "auth.user",
    "auth.profile",
    "auth",
    "user",
    "profile",
    "currentUser",
    "employee",
  ];
  for (const k of structured) {
    const obj = parseJSON(localStorage.getItem(k));
    const id = pullEmpId(obj);
    if (id) return id;
  }

  const simple = [
    "auth.employee_id",
    "employee_id",
    "employeeId",
    "employee.code",
    "employeeCode",
    "code",
  ];
  for (const k of simple) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }

  const token = localStorage.getItem("auth.token");
  const fromJwt =
    jwtClaim(token, "employee_id") ||
    jwtClaim(token, "employeeId") ||
    jwtClaim(token, "sub");
  if (fromJwt) return fromJwt;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const obj = parseJSON(localStorage.getItem(key));
    const id = pullEmpId(obj);
    if (id) return id;
  }
  return null;
};

/* ===================== Page ===================== */
export default function EmployeeWork({ employeeId: propEmployeeId }) {
  const dispatch = useDispatch();

  const rows = useSelector(selectWorklogs);
  const loading = useSelector(selectWorklogLoading);
  const error = useSelector(selectWorklogError);
  const updatingId = useSelector(selectUpdatingId);
  const filters = useSelector(selectWorklogFilters);
  const totals = useSelector(selectWorklogTotal);

  const { a, u, p } = useSelector(selectAuthBits);
  const [employeeId, setEmployeeId] = useState(
    propEmployeeId ||
      pullEmpId(u) ||
      pullEmpId(p) ||
      pullEmpId(a) ||
      sniffLocalStorageEmpId(),
  );

  useEffect(() => {
    if (propEmployeeId) {
      setEmployeeId(propEmployeeId);
      return;
    }
    const resolved =
      pullEmpId(u) || pullEmpId(p) || pullEmpId(a) || sniffLocalStorageEmpId();
    setEmployeeId(resolved || null);
  }, [propEmployeeId, a, u, p]);

  const [form, setForm] = useState({
    task: "",
    description: "",
    work_type: WorkType.FEATURE,
    status: WorklogStatus.TODO,
    work_date: today(),
  });

  const [manageOpen, setManageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const selectedRow = useMemo(
    () => rows.find((r) => r.id === selectedId) || null,
    [rows, selectedId],
  );

  useEffect(() => {
    if (!employeeId) return;
    dispatch(fetchWorklogsByEmployee({ employeeId }));
  }, [dispatch, employeeId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.task.trim() || !form.description.trim() || !employeeId) return;

    const payload = {
      employee_id: employeeId,
      task: form.task.trim(),
      description: form.description.trim(),
      work_type: form.work_type,
      status: form.status,
      work_date: form.work_date,
    };

    await dispatch(createWorklog(payload));
    setForm((f) => ({ ...f, task: "", description: "" }));
  };

  const handleCheckIn = async (row) => {
    try {
      const updated = await dispatch(
        checkInWorklog({ worklogId: row.id }),
      ).unwrap();
      if (updated?.id) setSelectedId(updated.id);
    } catch (err) {
      console.error("[Worklog] Check-in failed:", err);
    }
  };

  const handleCheckOut = async (row) => {
    try {
      const updated = await dispatch(
        checkOutWorklog({ worklogId: row.id }),
      ).unwrap();
      if (updated?.id) setSelectedId(updated.id);
    } catch (err) {
      console.error("[Worklog] Check-out failed:", err);
    }
  };

  const handleEditSave = async (row, draft) => {
    try {
      // ✅ 1) Update TIMES first (because this endpoint you proved works)
      const st = asHHMM(draft.start_time_hm);
      const et = asHHMM(draft.end_time_hm);

      if (st && et) {
        await dispatch(
          updateWorklogTimes({
            worklogId: row.id,
            start_time: st,
            end_time: et,
          }),
        ).unwrap();
      }

      // ✅ 2) Update fields (task/desc/type/status/date)
      const payload = {
        employee_id: row.employee_id, // ✅ keep this to avoid employee validation issues
        task: String(draft.task || "").trim(),
        description: String(draft.description || "").trim(),
        work_type: draft.work_type,
        status: draft.status,
        work_date: draft.work_date,
      };

      await dispatch(updateWorklog({ worklogId: row.id, payload })).unwrap();

      setEditOpen(false);
    } catch (err) {
      console.error("[Worklog] Edit save failed:", err);
    }
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;
    if (!confirm("Delete this worklog?")) return;

    try {
      await dispatch(deleteWorklog({ worklogId: row.id })).unwrap();
      if (selectedId === row.id) {
        setManageOpen(false);
        setEditOpen(false);
        setSelectedId(null);
      }
    } catch (err) {
      console.error("[Worklog] Delete failed:", err);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const byType = filters.type === "ALL" || r.work_type === filters.type;
      const byStatus = filters.status === "ALL" || r.status === filters.status;
      const byEmployee = !employeeId || r.employee_id === employeeId;
      return byType && byStatus && byEmployee;
    });
  }, [rows, filters, employeeId]);

  const columns = useMemo(
    () => [
      { key: "work_date", label: "Date", render: (r) => r.work_date || "" },
      { key: "task", label: "Title" },
      { key: "work_type", label: "Type", render: (r) => r.work_type || "-" },
      {
        key: "status",
        label: "Status",
        render: (r) => <StatusPill value={r.status || "TODO"} />,
      },
      {
        key: "start_time",
        label: "Check In",
        render: (r) => timeHM(r.start_time, r.work_date),
      },
      {
        key: "end_time",
        label: "Check Out",
        render: (r) => timeHM(r.end_time, r.work_date),
      },
      {
        key: "duration",
        label: "Duration (h)",
        render: (r) =>
          Number.isFinite(r.duration_hours)
            ? r.duration_hours.toFixed(2)
            : durHrs(r.start_time, r.end_time, r.work_date).toFixed(2),
      },
    ],
    [],
  );

  if (!employeeId) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="font-semibold">
            We couldn’t determine your employee ID.
          </div>
          <div className="mt-1 text-sm">
            Please sign in again, then reopen Worklog.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 bg-[#eef2ff] min-h-screen">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Work</h1>
          <p className="text-sm text-slate-600">
            Employee: <span className="font-semibold">{employeeId}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-slate-300 p-2 text-sm"
            value={filters.type}
            onChange={(e) =>
              dispatch(setWorklogFilters({ type: e.target.value }))
            }
          >
            <option value="ALL">All Types</option>
            {Object.values(WorkType).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            className="rounded-lg border border-slate-300 p-2 text-sm"
            value={filters.status}
            onChange={(e) =>
              dispatch(setWorklogFilters({ status: e.target.value }))
            }
          >
            <option value="ALL">All Status</option>
            {Object.values(WorklogStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-indigo-200 bg-white p-3 text-center">
          <div className="text-xs text-slate-500">Entries</div>
          <div className="text-xl font-semibold text-slate-900">
            {totals.count}
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-white p-3 text-center">
          <div className="text-xs text-slate-500">Total Hours</div>
          <div className="text-xl font-semibold text-slate-900">
            {totals.duration.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-indigo-200 bg-white/90 p-4 shadow">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium">Date</label>
            <input
              type="date"
              value={form.work_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, work_date: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium">Work Type</label>
            <select
              value={form.work_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, work_type: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
            >
              {Object.values(WorkType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
            >
              {Object.values(WorklogStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium">Title</label>
            <input
              type="text"
              value={form.task}
              onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
              placeholder="e.g., Design Home Page"
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Brief description…"
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div className="md:col-span-12 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Add Work"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-indigo-200/70 bg-white/90 shadow">
        {loading ? (
          <div className="p-6 text-center text-slate-600">Loading…</div>
        ) : error ? (
          <div className="m-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-6 text-center text-slate-600">No worklogs yet.</div>
        ) : (
          <div className="p-4">
            <div className="hidden md:block">
              <div className="overflow-hidden rounded-2xl border border-indigo-100">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white/95">
                      {columns.map((c) => (
                        <th
                          key={c.key}
                          className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap"
                        >
                          {c.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-[13px] font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => {
                      const busyRow = updatingId === r.id;
                      return (
                        <tr
                          key={r.id}
                          className={`align-middle transition-colors ${i % 2 ? "bg-indigo-50/40" : "bg-white"} hover:bg-indigo-100/40`}
                        >
                          {columns.map((c) => (
                            <td
                              key={c.key}
                              className="px-4 py-3 text-slate-900 align-top"
                            >
                              {c.render ? c.render(r) : r[c.key] || ""}
                            </td>
                          ))}

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedId(r.id);
                                setManageOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-indigo-700 shadow-sm hover:bg-indigo-50"
                              disabled={busyRow}
                            >
                              ⋯ Manage
                            </button>

                            <button
                              onClick={() => {
                                setSelectedId(r.id);
                                setEditOpen(true);
                              }}
                              className="ml-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-800 shadow-sm hover:bg-slate-50"
                              disabled={busyRow}
                            >
                              ✎ Edit
                            </button>

                            <button
                              onClick={() => handleDelete(r)}
                              className="ml-2 inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-rose-700 shadow-sm hover:bg-rose-50"
                              disabled={busyRow}
                            >
                              🗑 Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden space-y-3">
              {filteredRows.map((r) => {
                const busyRow = updatingId === r.id;
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm"
                  >
                    <div className="text-xs text-slate-500">
                      {r.work_date || "—"}
                    </div>
                    <div className="mt-0.5 font-semibold text-slate-900">
                      {r.task}
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                        {r.work_type || "-"}
                      </span>
                      <StatusPill value={r.status || "TODO"} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">Check In</div>
                        <div className="font-medium">
                          {timeHM(r.start_time, r.work_date) || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Check Out</div>
                        <div className="font-medium">
                          {timeHM(r.end_time, r.work_date) || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">
                          Duration (h)
                        </div>
                        <div className="font-medium">
                          {Number.isFinite(r.duration_hours)
                            ? r.duration_hours.toFixed(2)
                            : durHrs(
                                r.start_time,
                                r.end_time,
                                r.work_date,
                              ).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedId(r.id);
                          setManageOpen(true);
                        }}
                        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                        disabled={busyRow}
                      >
                        Manage
                      </button>

                      <button
                        onClick={() => {
                          setSelectedId(r.id);
                          setEditOpen(true);
                        }}
                        className="rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-900 disabled:opacity-60"
                        disabled={busyRow}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(r)}
                        className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-700 disabled:opacity-60"
                        disabled={busyRow}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-indigo-700/60">
              Enums: {Object.values(WorkType).join(", ")} |{" "}
              {Object.values(WorklogStatus).join(", ")}
            </div>
          </div>
        )}
      </div>

      <ManageWorklogModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        row={selectedRow}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        busy={updatingId === selectedId}
      />

      <EditWorklogModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        row={selectedRow}
        onSave={handleEditSave}
        busy={updatingId === selectedId}
      />
    </div>
  );
}
