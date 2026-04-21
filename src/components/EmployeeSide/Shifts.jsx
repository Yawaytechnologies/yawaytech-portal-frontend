import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdClose, MdOutlineSchedule, MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { fetchCurrentShift } from "../../redux/actions/shiftsActions";

import {
  clearShiftMessages,
  selectAssignError,
  selectAssignSuccess,
  selectCurrentShift,
  selectShiftError,
  selectShiftLoading,
} from "../../redux/reducer/shiftsSlice";

const today = () => new Date().toISOString().slice(0, 10);

const pageFont = {
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
};

const pickEmployeeId = (auth) => {
  const u = auth?.user || auth?.profile || auth || {};

  return (
    u.employee_id ||
    u.employeeId ||
    u.emp_id ||
    u.empId ||
    u.code ||
    u.employee_code ||
    u.employeeCode ||
    u.id ||
    null
  );
};

const readEmployeeIdFromLocalStorage = () => {
  try {
    const keys = ["auth.user", "auth.profile", "auth", "user", "employee"];

    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const obj = JSON.parse(raw);
      const id = pickEmployeeId(obj);

      if (id) return id;
    }

    return (
      localStorage.getItem("employee_id") ||
      localStorage.getItem("employeeId") ||
      localStorage.getItem("employeeCode") ||
      localStorage.getItem("code") ||
      null
    );
  } catch {
    return null;
  }
};

const shortTime = (timeValue) => {
  if (!timeValue) return "—";

  const s = String(timeValue).trim();

  if (/^\d{1,2}:\d{2}/.test(s)) {
    const [hour = "", minute = ""] = s.split(":");
    return `${hour.padStart(2, "0")}:${minute}`;
  }

  const match = s.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "—";
};

const getShiftName = (current) => {
  return (
    current?.name ||
    current?.shift_name ||
    current?.shift_type ||
    current?.shift ||
    "—"
  );
};

const getTotalHours = (current) => {
  return (
    current?.total_hours ??
    current?.totalHours ??
    current?.hours ??
    current?.duration ??
    "—"
  );
};

export default function Shifts() {
  const dispatch = useDispatch();
  const nav = useNavigate();

  const auth = useSelector((state) => state.auth);

  const loading = useSelector(selectShiftLoading);
  const error = useSelector(selectShiftError);
  const current = useSelector(selectCurrentShift);

  const assignError = useSelector(selectAssignError);
  const assignSuccess = useSelector(selectAssignSuccess);

  const employeeId = useMemo(() => {
    const fromRedux = pickEmployeeId(auth);
    if (fromRedux) return fromRedux;

    return readEmployeeIdFromLocalStorage();
  }, [auth]);

  const [targetDate, setTargetDate] = useState(today());

  const load = useCallback(() => {
    if (!employeeId) return;

    dispatch(clearShiftMessages());
    dispatch(fetchCurrentShift({ employeeId, targetDate }));
  }, [dispatch, employeeId, targetDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClose = () => {
    nav(-1);
  };

  return (
    <div
      style={pageFont}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-[760px] overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-500 bg-gradient-to-r from-[#4f46e5] to-[#2563eb] px-5 py-3.5 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <MdOutlineSchedule className="text-[18px] text-white" />
            </span>

            <div className="min-w-0">
              <h2 className="text-[18px] font-semibold leading-tight text-white">
                Shift
              </h2>

              <p className="mt-0.5 truncate text-[11px] font-medium text-indigo-100">
                Employee:{" "}
                <span className="font-semibold text-white">
                  {employeeId || "—"}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Close"
            type="button"
          >
            <MdClose className="text-[20px]" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto bg-[#f5f7ff] p-4">
          {/* Target Date */}
          <div className="rounded-lg border border-indigo-100 bg-white px-4 py-3 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <label className="text-[13px] font-semibold text-slate-700">
                  Target Date
                </label>

                <div className="mt-1 text-[12px] font-normal text-slate-500">
                  {loading
                    ? "Loading..."
                    : current
                      ? "Active shift loaded"
                      : "No active shift found"}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[155px_105px]">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                />

                {/* <button
                  onClick={load}
                  type="button"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <MdRefresh className="text-[15px]" />
                  Refresh
                </button> */}
              </div>
            </div>
          </div>

          {/* Messages */}
          {(error || assignError || assignSuccess) && (
            <div className="mt-3 space-y-2">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
                  {String(error)}
                </div>
              )}

              {assignError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
                  {String(assignError)}
                </div>
              )}

              {assignSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700">
                  {String(assignSuccess)}
                </div>
              )}
            </div>
          )}

          {/* Shift Card */}
          <div className="mt-4 rounded-lg border border-indigo-100 bg-[#eef2ff] p-4 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[20px] font-semibold tracking-tight text-slate-900">
                {getShiftName(current)}
              </h2>

              <span className="text-[12px] font-medium text-slate-500">
                {targetDate || "—"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-indigo-100 bg-white px-4 py-3 shadow-sm">
                <div className="text-[12px] font-medium text-slate-500">
                  Start
                </div>

                <div className="mt-2 text-[20px] font-semibold tracking-tight text-slate-900">
                  {shortTime(current?.start_time)}
                </div>
              </div>

              <div className="rounded-lg border border-indigo-100 bg-white px-4 py-3 shadow-sm">
                <div className="text-[12px] font-medium text-slate-500">
                  End
                </div>

                <div className="mt-2 text-[20px] font-semibold tracking-tight text-slate-900">
                  {shortTime(current?.end_time)}
                </div>
              </div>

              <div className="rounded-lg border border-indigo-100 bg-white px-4 py-3 shadow-sm">
                <div className="text-[12px] font-medium text-slate-500">
                  Total Hours
                </div>

                <div className="mt-2 text-[20px] font-semibold tracking-tight text-slate-900">
                  {getTotalHours(current)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
