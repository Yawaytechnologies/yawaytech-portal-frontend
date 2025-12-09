import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  fetchActiveSession
} from "../../redux/actions/employeeSideAttendanceAction";

import { selectAttendanceRecords } from "../../redux/reducer/employeeSideAttendanceSlice";

dayjs.extend(duration);
dayjs.extend(isoWeek);

/* ---------------------------- UTILITIES ---------------------------- */

const fmtHM = (d) => (d ? dayjs(d).format("HH:mm") : "—");

const fmtDur = (ms) => {
  const dur = dayjs.duration(ms || 0);
  return `${String(Math.floor(dur.asHours())).padStart(2, "0")}:${String(
    dur.minutes()
  ).padStart(2, "0")}:${String(dur.seconds()).padStart(2, "0")}`;
};

export default function EmployeeAttendance() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /* ----------------------------- STATE ----------------------------- */

  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [popupOpen, setPopupOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const records = useSelector(selectAttendanceRecords);

  const todayKey = dayjs().format("YYYY-MM-DD");
  const todayRec = records[todayKey] ?? null;

  const isTodayInProgress = !!todayRec?.in && !todayRec?.out;
  const isTodayCompleted = !!todayRec?.in && !!todayRec?.out;

  /* ---------------------- RESTORE SESSION (MAIN FIX) ---------------------- */

  useEffect(() => {
    dispatch(loadAttendanceMonth());
    dispatch(fetchActiveSession()).then((res) => {
      const session = res?.payload;

      if (session?.checkInUtc && !session?.checkOutUtc) {
        localStorage.setItem("attendance.start", session.checkInUtc);
        localStorage.setItem("attendance.running", "true");
      }
    });
  }, [dispatch]);

  /* ------------------------------- TIMER ---------------------------------- */

  // Resume timer on refresh OR new tab
  useEffect(() => {
    const running = localStorage.getItem("attendance.running") === "true";
    const start = localStorage.getItem("attendance.start");

    if (!running || !start) return;

    // If backend already has check-out -> stop timer
    if (todayRec?.out) {
      localStorage.setItem("attendance.running", "false");
      return;
    }

    const startTime = new Date(start).getTime();

    const id = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(id);
  }, [todayRec]);

  // Timer when actively checked in now
  useEffect(() => {
    if (!isTodayInProgress || !todayRec?.in) {
      setElapsed(0);
      return;
    }

    const startTime = new Date(todayRec.in).getTime();
    const id = setInterval(() => setElapsed(Date.now() - startTime), 1000);

    return () => clearInterval(id);
  }, [isTodayInProgress, todayRec?.in]);

  /* ------------------------- CHECK-IN / OUT ------------------------------ */

const onCheckIn = () => {
  if (isTodayInProgress || isTodayCompleted) {
    toast.info("Today's attendance is already marked.");
    return;
  }

  dispatch(checkInToday()).then((action) => {
    if (action?.error) {
      toast.error(
        action.error.message || "Unable to check in. Please try again."
      );
      return;
    }

    const t = action?.payload?.record?.in || new Date().toISOString();

    localStorage.setItem("attendance.start", t);
    localStorage.setItem("attendance.running", "true");

    setElapsed(0);

    toast.success("Checked in successfully.");
  });
};

const onCheckOut = () => {
  if (!isTodayInProgress) {
    toast.info("You are not currently checked in.");
    return;
  }

  dispatch(checkOutToday({ existingInIso: todayRec?.in })).then((action) => {
    if (action?.error) {
      toast.error(
        action.error.message || "Unable to check out. Please try again."
      );
      return;
    }

    localStorage.removeItem("attendance.start");
    localStorage.setItem("attendance.running", "false");

    setElapsed(0);

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
    const rec = records[key];

    if (!rec) return { label: "Absent", code: "absent" };
    if (rec.in && !rec.out && key === todayKey)
      return { label: "In progress", code: "progress" };
    if (rec.in && !rec.out) return { label: "Missing checkout", code: "missing" };
    if (rec.totalMs > 0) return { label: "Present", code: "present" };

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

  const selRec = records[selectedDate] || null;

  /* ------------------------------ UI START ------------------------------ */

  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Employee Attendance</h1>
          <p className="text-sm text-slate-500">Track today’s time and history.</p>
        </div>

        <div
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            isTodayCompleted
              ? "bg-green-100 text-green-700"
              : isTodayInProgress
              ? "bg-yellow-100 text-yellow-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {isTodayCompleted
            ? "Completed"
            : isTodayInProgress
            ? "Checked in (running)"
            : "Not checked in"}
        </div>
      </div>

      {/* Buttons + Timer */}
      <div className="flex items-center gap-4">

        {!isTodayInProgress && !isTodayCompleted && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCheckIn}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg"
          >
            Check In
          </motion.button>
        )}

        {isTodayInProgress && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCheckOut}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg"
          >
            Check Out
          </motion.button>
        )}

        {isTodayCompleted && (
          <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            Attendance Completed
          </div>
        )}

        {/* Timer */}
        <div className="px-4 py-2 bg-white border rounded-lg font-mono text-lg">
          {isTodayInProgress ? fmtDur(elapsed) : "00:00:00"}
        </div>

        {/* Leave Page */}
        <button
          onClick={() => navigate("/employee/leave")}
          className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Apply Leave
        </button>
      </div>

      {/* -------------------------- Calendar -------------------------- */}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b">
          <div className="font-semibold">{month.format("MMMM YYYY")}</div>

          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 border rounded-md"
              onClick={() => setMonth((m) => m.subtract(1, "month"))}
            >
              Prev
            </button>

            <button
              className="px-3 py-1.5 border rounded-md"
              onClick={() => setMonth(dayjs().startOf("month"))}
            >
              Today
            </button>

            <button
              className="px-3 py-1.5 border rounded-md"
              onClick={() => setMonth((m) => m.add(1, "month"))}
            >
              Next
            </button>
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 px-3 pt-3 text-xs text-slate-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center pb-2">{d}</div>
          ))}
        </div>

        {/* Days */}
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
                className="relative h-20 p-2 rounded-lg bg-slate-50 hover:bg-slate-100"
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

                {(status.code === "present" ||
                  status.code === "progress" ||
                  status.code === "missing") && (
                  <span
                    className={`absolute bottom-2 left-2 h-2 w-2 rounded-full ${
                      status.code === "present"
                        ? "bg-emerald-600"
                        : status.code === "progress"
                        ? "bg-amber-500"
                        : "bg-orange-500"
                    }`}
                  />
                )}

                {rec?.totalMs > 0 && (
                  <div className="absolute bottom-2 right-2 text-[10px] text-slate-600">
                    {fmtDur(rec.totalMs)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------- POPUP -------------------------- */}

      <AnimatePresence>
        {popupOpen && (
          <motion.div
            className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPopupOpen(false)}
          >
            <motion.div
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
                      <span className="font-medium">{fmtHM(selRec.in)}</span>
                    </div>

                    <div>
                      <span className="text-slate-500">Check-Out:</span>{" "}
                      <span className="font-medium">{fmtHM(selRec.out)}</span>
                    </div>

                    <div>
                      <span className="text-slate-500">Total:</span>{" "}
                      <span className="font-medium">
                        {selRec.totalMs ? fmtDur(selRec.totalMs) : "00:00:00"}
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

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
