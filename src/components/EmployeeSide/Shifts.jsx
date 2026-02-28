import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdClose, MdOutlineSchedule, MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import {
  fetchCurrentShift,
  assignEmployeeShift,
} from "../../redux/actions/shiftsActions";

import {
  clearShiftMessages,
  selectAssignError,
  selectAssignSuccess,
  selectAssigning,
  selectCurrentShift,
  selectShiftError,
  selectShiftLoading,
} from "../../redux/reducer/shiftsSlice";

const today = () => new Date().toISOString().slice(0, 10);

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

const shortTime = (t) => {
  if (!t) return "—";
  const s = String(t).trim();
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);
  const m = s.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : "—";
};

export default function Shifts() {
  const dispatch = useDispatch();
  const nav = useNavigate();

  const auth = useSelector((s) => s.auth);

  const loading = useSelector(selectShiftLoading);
  const error = useSelector(selectShiftError);
  const current = useSelector(selectCurrentShift);

  const assigning = useSelector(selectAssigning);
  const assignError = useSelector(selectAssignError);
  const assignSuccess = useSelector(selectAssignSuccess);

  const employeeId = useMemo(() => {
    const fromRedux = pickEmployeeId(auth);
    if (fromRedux) return fromRedux;

    // fallback localStorage
    try {
      const raw = localStorage.getItem("auth.user");
      if (raw) {
        const obj = JSON.parse(raw);
        return (
          obj?.employee_id || obj?.employeeId || obj?.code || obj?.id || null
        );
      }
    } catch {}
    return null;
  }, [auth]);

  const [targetDate, setTargetDate] = useState(today());

  const [form, setForm] = useState({
    shift_id: "",
    effective_from: today(),
    effective_to: today(),
  });

  const apiEnabled = useMemo(() => {
    const token = localStorage.getItem("auth.token");
    return !!token;
  }, []);

  const load = () => {
    if (!employeeId) return;
    dispatch(clearShiftMessages());
    dispatch(fetchCurrentShift({ employeeId, targetDate }));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, targetDate]);

  useEffect(() => {
    if (assignSuccess) {
      // after assign, refresh current shift based on effective_from
      dispatch(
        fetchCurrentShift({ employeeId, targetDate: form.effective_from }),
      );
      setTargetDate(form.effective_from);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignSuccess]);

  const onAssign = async (e) => {
    e.preventDefault();
    dispatch(clearShiftMessages());

    if (!employeeId) return;

    const shiftIdNum = Number(form.shift_id);
    if (!Number.isFinite(shiftIdNum) || shiftIdNum <= 0) {
      alert("Shift ID must be a valid number (ex: 1)");
      return;
    }
    if (!form.effective_from || !form.effective_to) {
      alert("Select Effective From and Effective To dates");
      return;
    }
    if (form.effective_to < form.effective_from) {
      alert("Effective To must be >= Effective From");
      return;
    }

    const payload = {
      employee_id: String(employeeId),
      shift_id: shiftIdNum,
      effective_from: form.effective_from,
      effective_to: form.effective_to,
    };

    dispatch(assignEmployeeShift(payload));
  };

  const topDateLabel = targetDate === today() ? "Today" : targetDate;

  return (
    <div className="min-h-[calc(100vh-90px)] flex items-start justify-center py-6">
      {/* Modal-like card */}
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-start justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center">
              <MdOutlineSchedule className="text-orange-500 text-xl" />
            </span>
            <div>
              <div className="font-extrabold text-slate-900 leading-tight">
                Shift
              </div>
              <div className="text-xs text-slate-500">
                Employee:{" "}
                <span className="font-semibold">{employeeId || "—"}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => nav(-1)}
            className="h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
            aria-label="Close"
          >
            <MdClose className="text-xl text-slate-700" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* top controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-slate-600">
              {loading
                ? "Loading..."
                : current
                  ? "Active shift loaded"
                  : "No active shift found"}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
              />
              <button
                onClick={load}
                type="button"
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center gap-2 text-sm font-semibold"
              >
                <MdRefresh />
                Refresh
              </button>
            </div>
          </div>

          {/* errors */}
          {(error || assignError || assignSuccess) && (
            <div className="mt-4 space-y-2">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {String(error)}
                </div>
              )}
              {assignError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {String(assignError)}
                </div>
              )}
              {assignSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {String(assignSuccess)}
                </div>
              )}
            </div>
          )}

          {/* Current shift panel */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-800">—</div>
              <div className="text-xs text-slate-500">{topDateLabel}</div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-white border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Start</div>
                <div className="mt-1 font-semibold text-slate-800">
                  {shortTime(current?.start_time)}
                </div>
              </div>

              <div className="rounded-lg bg-white border border-slate-200 p-3">
                <div className="text-xs text-slate-500">End</div>
                <div className="mt-1 font-semibold text-slate-800">
                  {shortTime(current?.end_time)}
                </div>
              </div>

              <div className="rounded-lg bg-white border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Total Hours</div>
                <div className="mt-1 font-semibold text-slate-800">
                  {current?.total_hours ?? "—"}
                </div>
              </div>

              <div className="rounded-lg bg-white border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Night</div>
                <div className="mt-1 font-semibold text-slate-800">
                  {current?.is_night ? "Yes" : current ? "No" : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Assign section */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <div className="font-bold text-slate-900">Assign Shift</div>

            <form
              onSubmit={onAssign}
              className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Shift ID
                </label>
                <input
                  value={form.shift_id}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, shift_id: e.target.value }))
                  }
                  placeholder="ex: 1"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Effective From
                </label>
                <input
                  type="date"
                  value={form.effective_from}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, effective_from: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Effective To
                </label>
                <input
                  type="date"
                  value={form.effective_to}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, effective_to: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Shift Type
                </label>
                <input
                  value={current?.name || ""}
                  readOnly
                  placeholder="—"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => nav(-1)}
                  className="h-9 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={!apiEnabled || assigning}
                  className="h-9 px-5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-extrabold disabled:opacity-60"
                >
                  {assigning ? "Assigning..." : "Assign"}
                </button>
              </div>
            </form>
          </div>

          {/* footer */}
          <div className="mt-4 text-xs text-slate-500">
            {apiEnabled ? "API enabled" : "API disabled (no token)"}
          </div>
        </div>
      </div>
    </div>
  );
}
