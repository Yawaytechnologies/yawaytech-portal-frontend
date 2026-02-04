import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { selectEmployeeId } from "../../redux/reducer/authSlice";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import isoWeek from "dayjs/plugin/isoWeek";
import { toast } from "react-toastify";

import {
  loadAttendanceMonth,
  checkInToday,
  checkOutToday,
} from "../../redux/actions/employeeSideAttendanceAction";

import { selectAttendanceRecords } from "../../redux/reducer/employeeSideAttendanceSlice";

dayjs.extend(duration);
dayjs.extend(isoWeek);

const MAX_DAILY_MS = Infinity;

/** ✅ FIX: define once at top-level (NOT inside useEffect) */
const normalizeIso = (iso) =>
  iso ? String(iso).replace(/\.(\d{3})\d+Z$/, ".$1Z") : iso;

const toMs = (iso) => {
  const t = Date.parse(normalizeIso(iso));
  return Number.isFinite(t) ? t : NaN;
};

/* ---------------------------- UTILITIES ---------------------------- */
const fmtHM = (v) => {
  if (!v) return "—";
  const d = dayjs(normalizeIso(v));
  if (d.isValid()) return d.format("hh:mm A");
  return String(v);
};

const fmtDur = (ms) => {
  const dur = dayjs.duration(ms || 0);
  return `${String(Math.floor(dur.asHours())).padStart(2, "0")}:${String(
    dur.minutes(),
  ).padStart(2, "0")}:${String(dur.seconds()).padStart(2, "0")}`;
};

export default function EmployeeAttendance() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const employeeId = useSelector(selectEmployeeId);

  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [popupOpen, setPopupOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lsPing, setLsPing] = useState(0);

  const records = useSelector(selectAttendanceRecords);

  const todayKey = dayjs().format("YYYY-MM-DD");
  const todayRec = records[todayKey] ?? null;

  const reachedLimit = false;

  const isTodayInProgress = !!todayRec?.in && !todayRec?.out;
  const isTodayCompleted = !!todayRec?.in && !!todayRec?.out;

  /* ---------------------- LOCAL STORAGE LOCK ---------------------- */
  const safeJson = (v) => {
    try {
      return JSON.parse(v ?? "null");
    } catch {
      return null;
    }
  };

  const stableEmpKey = useMemo(() => {
    const u =
      safeJson(localStorage.getItem("auth.user")) ||
      safeJson(localStorage.getItem("user"));

    return (
      employeeId ||
      u?.employeeId ||
      u?.employee_id ||
      u?.empId ||
      u?.emp_id ||
      null
    );
  }, [employeeId, lsPing]);

  const LS = useMemo(() => {
    const k = stableEmpKey || "NO_EMP";
    return {
      running: `attendance.${k}.running`,
      start: `attendance.${k}.start`,
      date: `attendance.${k}.date`,
      records: `attendance.${k}.records.v1`,
    };
  }, [stableEmpKey]);

  /** ✅ FIX: bump lsPing so SAME TAB updates instantly after localStorage writes */
  const setLocalRun = (iso) => {
    const fixed = normalizeIso(iso);
    localStorage.setItem(LS.start, fixed);
    localStorage.setItem(LS.running, "true");
    localStorage.setItem(LS.date, todayKey);
    setLsPing((n) => n + 1);
  };

  const clearLocalRun = () => {
    localStorage.removeItem(LS.start);
    localStorage.removeItem(LS.date);
    localStorage.setItem(LS.running, "false");
    setLsPing((n) => n + 1);
  };

  const localRunning = useMemo(() => {
    if (!stableEmpKey) return false;

    return (
      localStorage.getItem(LS.running) === "true" &&
      localStorage.getItem(LS.date) === todayKey &&
      !!localStorage.getItem(LS.start)
    );
  }, [stableEmpKey, LS, todayKey, lsPing]);

  const effectiveInProgress = useMemo(() => {
    return isTodayInProgress || (localRunning && !isTodayCompleted);
  }, [isTodayInProgress, localRunning, isTodayCompleted]);

  const effectiveStartIso = useMemo(() => {
    return todayRec?.in || localStorage.getItem(LS.start) || null;
  }, [todayRec?.in, LS, lsPing]);

  /* ---------------------- LOAD MONTH + RESTORE RUNNING ---------------------- */
  useEffect(() => {
    const onStorage = (e) => {
      if (e?.key && e.key.startsWith("attendance.")) {
        setLsPing((n) => n + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!stableEmpKey) return;

    dispatch(
      loadAttendanceMonth({
        employeeId: stableEmpKey,
        monthISO: month.startOf("month").format("YYYY-MM-01"),
      }),
    )
      .then((action) => {
        const map = action?.payload || null;
        if (!map) return;

        const r = map[todayKey];

        if (r?.in && !r?.out) setLocalRun(r.in); // restore running
        if (r?.in && r?.out) clearLocalRun(); // cleanup
      })
      .catch(() => {});
  }, [dispatch, stableEmpKey, month, todayKey]);

  /* ------------------------------- TIMER ------------------------------- */
  useEffect(() => {
    if (!effectiveInProgress || !effectiveStartIso) {
      setElapsed(0);
      return;
    }

    if (todayRec?.out) {
      clearLocalRun();
      setElapsed(0);
      return;
    }

    const startTime = toMs(effectiveStartIso);
    if (!Number.isFinite(startTime)) {
      setElapsed(0);
      return;
    }

    const tick = () => setElapsed(Math.max(0, Date.now() - startTime));
    tick();

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [effectiveInProgress, effectiveStartIso, todayRec?.out, reachedLimit]);

  /* ------------------------- CHECK-IN / OUT ------------------------------ */
  const refreshTodayMonth = () => {
    if (!stableEmpKey) return;
    dispatch(
      loadAttendanceMonth({
        employeeId: stableEmpKey,
        monthISO: dayjs().startOf("month").format("YYYY-MM-01"),
      }),
    );
  };

  const onCheckIn = () => {
    if (!stableEmpKey) {
      toast.error("Missing employeeId");
      return;
    }

    if (effectiveInProgress) {
      toast.info("You are already checked in today.");
      return;
    }

    dispatch(checkInToday({ employeeId: stableEmpKey })).then((action) => {
      if (action?.error) {
        toast.error(
          action.error.message || "Unable to check in. Please try again.",
        );
        return;
      }

      const t = normalizeIso(
        action?.payload?.record?.in || new Date().toISOString(),
      );
      setLocalRun(t); // ✅ instant UI + starts timer
      refreshTodayMonth();
      toast.success("Checked in successfully.");
    });
  };

  const onCheckOut = () => {
    if (!stableEmpKey) {
      toast.error("Missing employeeId");
      return;
    }

    if (!effectiveInProgress) {
      toast.info("You are not currently checked in.");
      return;
    }

    dispatch(
      checkOutToday({
        employeeId: stableEmpKey,
        existingInIso: todayRec?.in || effectiveStartIso,
      }),
    ).then((action) => {
      if (action?.error) {
        toast.error(
          action.error.message || "Unable to check out. Please try again.",
        );
        return;
      }

      clearLocalRun(); // ✅ stops timer instantly
      setElapsed(0);
      refreshTodayMonth();
      toast.success("Checked out successfully.");
    });
  };

  /* ------------------------------ CALENDAR ------------------------------ */
  const gridDays = useMemo(() => {
    const start = month.startOf("month");
    const end = month.endOf("month");
    const startGrid = start.startOf("isoWeek");
    const endGrid = end.endOf("isoWeek");

    const days = [];
    let cur = startGrid;

    while (cur.isBefore(endGrid) || cur.isSame(endGrid, "day")) {
      days.push(cur);
      cur = cur.add(1, "day");
    }

    return days;
  }, [month]);

  const getStatus = (key) => {
    if (key === todayKey && effectiveInProgress) {
      return { label: "In progress", code: "progress" };
    }

    const rec = records[key];
    if (!rec) return { label: "Absent", code: "absent" };

    if (key === todayKey && Number(rec.totalMs || 0) >= MAX_DAILY_MS) {
      return { label: "Present", code: "present" };
    }

    if (rec.in && !rec.out)
      return { label: "Missing checkout", code: "missing" };
    if (rec.in && rec.out) return { label: "Present", code: "present" };
    if (rec.in && rec.out) return { label: "Present", code: "present" };
    return { label: "Absent", code: "absent" };

   
  };

  const ariaLabelForDate = (key) => {
    const status = getStatus(key);
    const dateTxt = dayjs(key).format("dddd, DD MMM YYYY");
    const rec = records[key];

    let extra = "";
    if (rec?.totalMs) extra = `, total ${fmtDur(rec.totalMs)}`;
    else if (status.code === "progress") extra = ", running";
    else if (status.code === "missing") extra = ", missing checkout";

    return `${dateTxt}, ${status.label}${extra}`;
  };

  const selRec = useMemo(() => {
    const fromRedux = records[selectedDate] || null;

    const fromLS = (() => {
      try {
        const key = `attendance.${stableEmpKey || "unknown"}.records.v1`;
        const all = JSON.parse(localStorage.getItem(key) || "{}") || {};
        return all[selectedDate] || null;
      } catch {
        return null;
      }
    })();

    if (!fromRedux) return fromLS;
    if (!fromLS) return fromRedux;

    return {
      ...fromLS,
      ...fromRedux,
      in: fromRedux.in || fromLS.in || null,
      out: fromRedux.out || fromLS.out || null,
      totalMs: Math.max(
        Number(fromLS.totalMs || 0),
        Number(fromRedux.totalMs || 0),
      ),
    };
  }, [records, selectedDate, stableEmpKey]);

  /* ------------------------------ UI START ------------------------------ */
  /** ✅ FIX: after checkout show last worked time */
  const displayTotalMs = effectiveInProgress
    ? elapsed
    : Number(todayRec?.totalMs || 0);

  const popupTotalMs =
    selectedDate === todayKey && effectiveInProgress
      ? elapsed
      : Number(selRec?.totalMs || 0);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Employee Attendance</h1>
          <p className="text-sm text-slate-500">
            Track today’s time and history.
          </p>
        </div>

        <div
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            reachedLimit
              ? "bg-green-100 text-green-700"
              : effectiveInProgress
                ? "bg-yellow-100 text-yellow-700"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {reachedLimit
            ? "Daily limit completed"
            : effectiveInProgress
              ? "Checked in (running)"
              : "Not checked in"}
        </div>
      </div>

      {/* Buttons + Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {!effectiveInProgress && !reachedLimit && (
          <Motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCheckIn}
            className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white rounded-lg"
          >
            Check In
          </Motion.button>
        )}

        {effectiveInProgress && (
          <Motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCheckOut}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white rounded-lg"
          >
            Check Out
          </Motion.button>
        )}

        <div className="w-full sm:w-auto px-4 py-2 bg-white border rounded-lg font-mono text-lg text-center">
          {fmtDur(displayTotalMs)}
        </div>

        <button
          onClick={() => navigate("/employee/leave")}
          className="w-full sm:w-auto sm:ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Apply Leave
        </button>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-semibold text-center sm:text-left">
              {month.format("MMMM YYYY")}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
              <button
                className="w-full px-3 py-2 border rounded-md text-sm bg-white active:scale-[0.98]"
                onClick={() => setMonth((m) => m.subtract(1, "month"))}
              >
                Prev
              </button>

              <button
                className="w-full px-3 py-2 border rounded-md text-sm bg-white active:scale-[0.98]"
                onClick={() => setMonth(dayjs().startOf("month"))}
              >
                Today
              </button>

              <button
                className="w-full px-3 py-2 border rounded-md text-sm bg-white active:scale-[0.98]"
                onClick={() => setMonth((m) => m.add(1, "month"))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 px-3 pt-3 text-xs text-slate-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center pb-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 p-3">
          {gridDays.map((d) => {
            const key = d.format("YYYY-MM-DD");
            const rec = records[key];
            const status = getStatus(key);
            const isToday = key === todayKey;

            return (
              <button
                key={key}
                aria-label={ariaLabelForDate(key)}
                className="relative h-14 sm:h-20 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-[0.99] outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none
                focus:bg-slate-50 active:bg-slate-100 [-webkit-tap-highlight-color:transparent]"
                onClick={() => {
                  setSelectedDate(key);
                  setPopupOpen(true);
                }}
              >
                <div className="flex justify-between">
                  <span>{d.date()}</span>

                  {isToday && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                      Today
                    </span>
                  )}
                </div>

                {status.code === "present" && (
                  <span className="absolute bottom-2 left-2 h-2 w-2 rounded-full bg-emerald-600" />
                )}

                {rec?.totalMs > 0 && (
                  <div className="hidden sm:block absolute bottom-2 right-2 text-[10px] text-slate-600">
                    {fmtDur(rec.totalMs)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* POPUP */}
      <AnimatePresence>
        {popupOpen && (
          <Motion.div
            className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPopupOpen(false)}
          >
            <Motion.div
              className="bg-white rounded-xl shadow-xl max-w-md w-full border"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b flex justify-between">
                <div className="font-semibold">
                  {dayjs(selectedDate).format("dddd, DD MMM YYYY")}
                </div>
                <div className="text-sm text-slate-600">
                  {getStatus(selectedDate).label}
                </div>
              </div>

              <div className="px-5 py-4">
                {selRec ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-500">Check-In:</span>{" "}
                      <span className="font-medium">
                        {fmtHM(
                          selRec.in ||
                            selRec.first_check_in_utc ||
                            selRec.first_check_in_local ||
                            selRec.check_in_utc ||
                            selRec.check_in_local,
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500">Check-Out:</span>{" "}
                      <span className="font-medium">
                        {fmtHM(
                          selRec.out ||
                            selRec.last_check_out_utc ||
                            selRec.last_check_out_local ||
                            selRec.check_out_utc ||
                            selRec.check_out_local,
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500">Total:</span>{" "}
                      <span className="font-medium">
                        {popupTotalMs ? fmtDur(popupTotalMs) : "00:00:00"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>No record (Absent)</div>
                )}
              </div>

              <div className="px-5 py-3 border-t flex justify-end">
                <button
                  onClick={() => setPopupOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
