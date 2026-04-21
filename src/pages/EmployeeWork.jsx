import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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

/* ===================== Font ===================== */

const appFont = {
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
};

/* ===================== Helpers ===================== */

const today = () => new Date().toISOString().slice(0, 10);

const ASSUME_SERVER_TIMES_ARE_UTC = true;

const joinDT = (dateStr, timeStr) => {
  if (!timeStr) return null;

  const s = String(timeStr).trim();

  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(s)) {
    return s.replace(" ", "T");
  }

  if (/^\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?$/.test(s)) {
    const d = dateStr || today();
    return `${d}T${s}`;
  }

  return s;
};

function parseDateSafe(value, dateCtx) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(+value) ? null : value;

  let v = value;

  if (typeof v === "string" && /^\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?$/.test(v)) {
    v = joinDT(dateCtx, v);
  }

  if (typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(+d) ? null : d;
  }

  let s = String(v).trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00`);
    return Number.isNaN(+d) ? null : d;
  }

  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    s = s.replace(" ", "T");
  }

  const isoNoTZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?$/;

  if (ASSUME_SERVER_TIMES_ARE_UTC && isoNoTZ.test(s)) {
    const dUtc = new Date(`${s}Z`);
    return Number.isNaN(+dUtc) ? null : dUtc;
  }

  let d = new Date(s);
  if (!Number.isNaN(+d)) return d;

  d = new Date(`${s}Z`);
  return Number.isNaN(+d) ? null : d;
}

const toDateInputValue = (value) => {
  if (!value) return today();

  const s = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const dmy = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  const iso = s.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
  if (iso) return iso[1];

  const d = parseDateSafe(s);
  if (!d) return today();

  const year = d.toLocaleString("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  });

  const month = d.toLocaleString("en-CA", {
    timeZone: "Asia/Kolkata",
    month: "2-digit",
  });

  const day = d.toLocaleString("en-CA", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
  });

  return `${year}-${month}-${day}`;
};

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

const durHrs = (start, end, dateCtx) => {
  const ds = parseDateSafe(start, dateCtx);
  const de = parseDateSafe(end, dateCtx);

  if (!ds || !de) return 0;

  const ms = de.getTime() - ds.getTime();

  if (ms <= 0 || !Number.isFinite(ms)) return 0;

  return Math.round((ms / 36e5) * 100) / 100;
};

const asHHMM = (time) => {
  const s = String(time || "").trim();

  if (!s) return "";
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5);

  return s;
};

const getRowTitle = (row) => row?.task || row?.title || row?.name || "";

const getRowDescription = (row) =>
  row?.description || row?.desc || row?.details || "";

const normalizeSelectValue = (value, allowedValues, fallback) => {
  const raw = String(value || "").trim();

  if (!raw) return fallback;

  const found = allowedValues.find((item) => {
    const itemText = String(item);

    return (
      itemText === raw ||
      itemText.toLowerCase() === raw.toLowerCase() ||
      itemText.replace(/_/g, " ").toLowerCase() === raw.toLowerCase()
    );
  });

  return found || fallback;
};

/* ===================== Small Components ===================== */

function StatusPill({ value }) {
  const status = value || "TODO";

  const cls =
    status === "DONE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "IN_PROGRESS"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-indigo-200 bg-indigo-50 text-indigo-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;

  return createPortal(
    <div
      style={appFont}
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/50 px-3 py-4 backdrop-blur-sm"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 flex min-h-full items-start justify-center sm:items-center">
        <div
          className={[
            "w-full overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-2xl",
            "max-h-[calc(100dvh-32px)]",
            wide ? "max-w-[390px] sm:max-w-[720px]" : "max-w-[390px]",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-indigo-500 bg-gradient-to-r from-[#4f46e5] to-[#2563eb] px-4 py-3 text-white">
            <h3 className="truncate text-[16px] font-semibold leading-tight">
              {title}
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-[20px] font-light text-white hover:bg-white/25"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="max-h-[calc(100dvh-92px)] overflow-y-auto bg-[#f5f7ff] p-4">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ===================== Manage Modal ===================== */

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
      title={`Manage: ${getRowTitle(row) || "Worklog"}`}
      wide
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-indigo-100 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[12px] font-medium text-slate-500">Employee</p>
              <p className="mt-1 break-words text-[13px] font-semibold text-slate-900">
                {row.employee_id || "—"}
              </p>
            </div>

            <div>
              <p className="text-[12px] font-medium text-slate-500">Date</p>
              <p className="mt-1 text-[13px] font-semibold text-slate-900">
                {row.work_date || "—"}
              </p>
            </div>

            <div>
              <p className="mb-1 text-[12px] font-medium text-slate-500">
                Status
              </p>
              <StatusPill value={row.status || "TODO"} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[12px] font-medium text-slate-500">
                Start Time
              </p>
              <p className="mt-1 text-[13px] font-semibold text-slate-900">
                {fmtDateTimeIST(row.start_time, row.work_date)}
              </p>
            </div>

            <div>
              <p className="text-[12px] font-medium text-slate-500">End Time</p>
              <p className="mt-1 text-[13px] font-semibold text-slate-900">
                {fmtDateTimeIST(row.end_time, row.work_date)}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[12px] font-medium text-slate-500">
              Description
            </p>
            <p className="mt-1 break-words text-[13px] font-normal leading-5 text-slate-800">
              {getRowDescription(row) || "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {/* <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button> */}

          <button
            type="button"
            onClick={() => onCheckIn(row)}
            disabled={busy || hasStart}
            className="h-9 rounded-lg bg-emerald-600 px-3 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasStart ? "Checked-In" : busy ? "Checking..." : "Check-In"}
          </button>

          <button
            type="button"
            onClick={() => onCheckOut(row)}
            disabled={busy || !hasStart || hasEnd}
            className="h-9 rounded-lg bg-rose-600 px-3 text-[13px] font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasEnd ? "Checked-Out" : busy ? "Checking..." : "Check-Out"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ===================== Edit Modal ===================== */

function EditWorklogModal({ open, onClose, row, onSave, busy }) {
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!open || !row) return;

    const allowedTypes = Object.values(WorkType);
    const allowedStatuses = Object.values(WorklogStatus);

    setDraft({
      work_date: toDateInputValue(row.work_date),
      task: getRowTitle(row),
      description: getRowDescription(row),
      work_type: normalizeSelectValue(
        row.work_type,
        allowedTypes,
        WorkType.FEATURE,
      ),
      status: normalizeSelectValue(
        row.status,
        allowedStatuses,
        WorklogStatus.TODO,
      ),
      start_time_hm: toTimeInput(row.start_time, row.work_date),
      end_time_hm: toTimeInput(row.end_time, row.work_date),
    });
  }, [open, row]);

  if (!row || !draft) return null;

  const inputClass =
    "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100";

  const labelClass = "mb-1 block text-[12px] font-medium text-slate-600";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit: ${getRowTitle(row) || "Worklog"}`}
      wide
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={draft.work_date}
              onChange={(e) =>
                setDraft((d) => ({ ...d, work_date: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft((d) => ({ ...d, status: e.target.value }))
              }
              className={inputClass}
            >
              {Object.values(WorklogStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Work Type</label>
            <select
              value={draft.work_type}
              onChange={(e) =>
                setDraft((d) => ({ ...d, work_type: e.target.value }))
              }
              className={inputClass}
            >
              {Object.values(WorkType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={draft.task}
              onChange={(e) =>
                setDraft((d) => ({ ...d, task: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] font-normal leading-5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className={labelClass}>Start Time</label>
            <input
              type="time"
              value={draft.start_time_hm}
              onChange={(e) =>
                setDraft((d) => ({ ...d, start_time_hm: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>End Time</label>
            <input
              type="time"
              value={draft.end_time_hm}
              onChange={(e) =>
                setDraft((d) => ({ ...d, end_time_hm: e.target.value }))
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-indigo-100 pt-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onSave(row, draft)}
            disabled={busy}
            className="h-9 rounded-lg bg-[#4f46e5] px-3 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Saving..." : "Update Worklog"}
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

  for (const key of structured) {
    const obj = parseJSON(localStorage.getItem(key));
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

  for (const key of simple) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  const token =
    localStorage.getItem("auth.token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token");

  const fromJwt =
    jwtClaim(token, "employee_id") ||
    jwtClaim(token, "employeeId") ||
    jwtClaim(token, "sub");

  if (fromJwt) return fromJwt;

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    const obj = parseJSON(localStorage.getItem(key));
    const id = pullEmpId(obj);
    if (id) return id;
  }

  return null;
};

/* ===================== Main Page ===================== */

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
    () => rows.find((r) => String(r.id) === String(selectedId)) || null,
    [rows, selectedId],
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

    setForm((prev) => ({
      ...prev,
      task: "",
      description: "",
    }));
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

      const payload = {
        employee_id: row.employee_id,
        task: String(draft.task || "").trim(),
        description: String(draft.description || "").trim(),
        work_type: normalizeSelectValue(
          draft.work_type,
          Object.values(WorkType),
          WorkType.FEATURE,
        ),
        status: normalizeSelectValue(
          draft.status,
          Object.values(WorklogStatus),
          WorklogStatus.TODO,
        ),
        work_date: toDateInputValue(draft.work_date),
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

      if (String(selectedId) === String(row.id)) {
        setManageOpen(false);
        setEditOpen(false);
        setSelectedId(null);
      }
    } catch (err) {
      console.error("[Worklog] Delete failed:", err);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const byType = filters.type === "ALL" || row.work_type === filters.type;
      const byStatus =
        filters.status === "ALL" || row.status === filters.status;
      const byEmployee = !employeeId || row.employee_id === employeeId;

      return byType && byStatus && byEmployee;
    });
  }, [rows, filters, employeeId]);

  const columns = useMemo(
    () => [
      {
        key: "work_date",
        label: "Date",
        render: (row) => row.work_date || "",
      },
      {
        key: "task",
        label: "Title",
        render: (row) => getRowTitle(row),
      },
      {
        key: "work_type",
        label: "Type",
        render: (row) => row.work_type || "-",
      },
      {
        key: "status",
        label: "Status",
        render: (row) => <StatusPill value={row.status || "TODO"} />,
      },
      {
        key: "start_time",
        label: "Check In",
        render: (row) => timeHM(row.start_time, row.work_date) || "—",
      },
      {
        key: "end_time",
        label: "Check Out",
        render: (row) => timeHM(row.end_time, row.work_date) || "—",
      },
      {
        key: "duration",
        label: "Duration",
        render: (row) =>
          Number.isFinite(row.duration_hours)
            ? row.duration_hours.toFixed(2)
            : durHrs(row.start_time, row.end_time, row.work_date).toFixed(2),
      },
    ],
    [],
  );

  if (!employeeId) {
    return (
      <div
        style={appFont}
        className="min-h-screen bg-[#eef2ff] px-3 py-4 sm:px-6"
      >
        <div className="mx-auto max-w-4xl rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
          <p className="text-[13px] font-semibold">
            We could not determine your employee ID.
          </p>
          <p className="mt-1 text-[12px]">
            Please sign in again, then reopen Worklog.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={appFont}
      className="min-h-screen w-full overflow-x-hidden bg-[#eef2ff] px-3 py-4 sm:px-4 md:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 sm:text-[22px]">
              Employee Work
            </h1>

            <p className="mt-1 text-[12px] font-normal text-slate-500">
              Employee:{" "}
              <span className="font-semibold text-slate-700">{employeeId}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-[13px] font-normal text-slate-800 outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              value={filters.type}
              onChange={(e) =>
                dispatch(setWorklogFilters({ type: e.target.value }))
              }
            >
              <option value="ALL">All Types</option>
              {Object.values(WorkType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-[13px] font-normal text-slate-800 outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              value={filters.status}
              onChange={(e) =>
                dispatch(setWorklogFilters({ status: e.target.value }))
              }
            >
              <option value="ALL">All Status</option>
              {Object.values(WorklogStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-indigo-100 bg-white p-3 text-center shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Entries
            </p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              {totals.count}
            </p>
          </div>

          <div className="rounded-lg border border-indigo-100 bg-white p-3 text-center shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Total Hours
            </p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              {totals.duration.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Add Form */}
        <div className="mb-5 rounded-lg border border-indigo-100 bg-white p-3 shadow-sm sm:p-4">
          <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <label className="mb-1 block text-[12px] font-medium text-slate-600">
                Date
              </label>
              <input
                type="date"
                value={form.work_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, work_date: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] font-normal text-slate-800 outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-[12px] font-medium text-slate-600">
                Work Type
              </label>
              <select
                value={form.work_type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, work_type: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] font-normal text-slate-800 outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              >
                {Object.values(WorkType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-[12px] font-medium text-slate-600">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] font-normal text-slate-800 outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              >
                {Object.values(WorklogStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="mb-1 block text-[12px] font-medium text-slate-600">
                Title
              </label>
              <input
                type="text"
                value={form.task}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, task: e.target.value }))
                }
                placeholder="e.g., Design Home Page"
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] font-normal text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="md:col-span-6">
              <label className="mb-1 block text-[12px] font-medium text-slate-600">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description..."
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] font-normal text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="md:col-span-12 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="h-9 w-full rounded-md bg-[#4f46e5] px-4 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Saving..." : "Add Work"}
              </button>
            </div>
          </form>
        </div>

        {/* Table / Cards */}
        <div className="rounded-lg border border-indigo-100 bg-white shadow-sm">
          {loading ? (
            <div className="p-5 text-center text-[13px] font-normal text-slate-600">
              Loading...
            </div>
          ) : error ? (
            <div className="m-3 rounded-md border border-red-200 bg-red-50 p-3 text-[13px] font-medium text-red-700">
              {error}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-5 text-center text-[13px] font-normal text-slate-600">
              No worklogs yet.
            </div>
          ) : (
            <div className="p-3">
              {/* Desktop */}
              <div className="hidden md:block">
                <div className="w-full overflow-x-auto rounded-lg border border-indigo-100">
                  <table className="min-w-[980px] w-full text-left">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#4f46e5] to-[#2563eb] text-white">
                        {columns.map((column) => (
                          <th
                            key={column.key}
                            className="whitespace-nowrap px-3 py-2.5 text-[12px] font-medium"
                          >
                            {column.label}
                          </th>
                        ))}

                        <th className="whitespace-nowrap px-3 py-2.5 text-center text-[12px] font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRows.map((row, index) => {
                        const busyRow = String(updatingId) === String(row.id);

                        return (
                          <tr
                            key={row.id}
                            className={`align-middle transition-colors ${
                              index % 2 ? "bg-indigo-50/40" : "bg-white"
                            } hover:bg-indigo-100/40`}
                          >
                            {columns.map((column) => (
                              <td
                                key={column.key}
                                className="max-w-[220px] break-words px-3 py-2.5 align-top text-[13px] font-normal leading-5 text-slate-800"
                              >
                                {column.render
                                  ? column.render(row)
                                  : row[column.key] || "—"}
                              </td>
                            ))}

                            <td className="whitespace-nowrap px-3 py-2.5 text-center">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedId(row.id);
                                    setManageOpen(true);
                                  }}
                                  disabled={busyRow}
                                  title="Manage"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-indigo-200 bg-white text-[14px] text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                                >
                                  ⋯
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedId(row.id);
                                    setEditOpen(true);
                                  }}
                                  disabled={busyRow}
                                  title="Edit"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-[13px] text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                  ✎
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(row)}
                                  disabled={busyRow}
                                  title="Delete"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-rose-200 bg-white text-[13px] text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                                >
                                  🗑
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile */}
              <div className="space-y-3 md:hidden">
                {filteredRows.map((row) => {
                  const busyRow = String(updatingId) === String(row.id);

                  return (
                    <div
                      key={row.id}
                      className="rounded-lg border border-indigo-100 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12px] font-normal text-slate-500">
                            {row.work_date || "—"}
                          </p>

                          <p className="mt-1 break-words text-[15px] font-semibold leading-5 text-slate-900">
                            {getRowTitle(row)}
                          </p>
                        </div>

                        <StatusPill value={row.status || "TODO"} />
                      </div>

                      <div className="mt-2">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-normal text-slate-600">
                          {row.work_type || "-"}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                        <div className="rounded-md bg-slate-50 p-2">
                          <p className="text-[11px] font-medium text-slate-500">
                            Check In
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {timeHM(row.start_time, row.work_date) || "—"}
                          </p>
                        </div>

                        <div className="rounded-md bg-slate-50 p-2">
                          <p className="text-[11px] font-medium text-slate-500">
                            Check Out
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {timeHM(row.end_time, row.work_date) || "—"}
                          </p>
                        </div>

                        <div className="rounded-md bg-slate-50 p-2">
                          <p className="text-[11px] font-medium text-slate-500">
                            Duration
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {Number.isFinite(row.duration_hours)
                              ? row.duration_hours.toFixed(2)
                              : durHrs(
                                  row.start_time,
                                  row.end_time,
                                  row.work_date,
                                ).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(row.id);
                            setManageOpen(true);
                          }}
                          disabled={busyRow}
                          className="h-9 rounded-md bg-[#4f46e5] text-[12px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          Manage
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(row.id);
                            setEditOpen(true);
                          }}
                          disabled={busyRow}
                          className="h-9 rounded-md bg-slate-800 text-[12px] font-medium text-white hover:bg-slate-900 disabled:opacity-60"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          disabled={busyRow}
                          className="h-9 rounded-md bg-rose-600 text-[12px] font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <ManageWorklogModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        row={selectedRow}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        busy={String(updatingId) === String(selectedId)}
      />

      <EditWorklogModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        row={selectedRow}
        onSave={handleEditSave}
        busy={String(updatingId) === String(selectedId)}
      />
    </div>
  );
}
