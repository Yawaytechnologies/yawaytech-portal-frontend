import React, { useEffect, useMemo, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import isoWeek from "dayjs/plugin/isoWeek";

// Redux thunks & selectors
import {
  loadAttendanceMonth,
  checkInToday,
  checkOutToday,
} from "../../redux/actions/employeeSideAttendanceAction";
import {
  selectAttendanceRecords,
  selectIsCheckedIn,
} from "../../redux/reducer/employeeSideAttendanceSlice";

dayjs.extend(duration);
dayjs.extend(isoWeek);

/* ------------------------------ UTILITIES --------------------------------- */
const fmtHM = (d) => (d ? dayjs(d).format("HH:mm") : "—");
const fmtDur = (ms) => {
  const dur = dayjs.duration(ms || 0);
  const hh = String(Math.floor(dur.asHours())).padStart(2, "0");
  const mm = String(dur.minutes()).padStart(2, "0");
  const ss = String(dur.seconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

export default function EmployeeAttendance() {
  const navigate = useNavigate();

  /* ---------------------------- CAL STATE --------------------------------- */
  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [popupOpen, setPopupOpen] = useState(false);

  /* --------------------------- REDUX STATE -------------------------------- */
  const dispatch = useDispatch();
  const records = useSelector(selectAttendanceRecords);
  const isCheckedIn = useSelector(selectIsCheckedIn);

  const todayKey = dayjs().format("YYYY-MM-DD");
  const todayRec = records[todayKey] ?? null;

  /* ----------------------------- TIMER ------------------------------------ */
  const [elapsed, setElapsed] = useState(() => {
    if (isCheckedIn && todayRec?.in) return Date.now() - new Date(todayRec.in).getTime();
    return 0;
  });

  useEffect(() => {
    if (!isCheckedIn) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => {
      const start = records[todayKey]?.in
        ? new Date(records[todayKey].in).getTime()
        : Date.now();
      setElapsed(Date.now() - start);
    }, 1000);
    return () => clearInterval(id);
  }, [isCheckedIn, records, todayKey]);

  /* --------------------------- DATA FETCH --------------------------------- */
  useEffect(() => {
    dispatch(loadAttendanceMonth(month));
  }, [dispatch, month]);

  /* ----------------------------- ACTIONS ---------------------------------- */
  const onCheckIn = () => {
    if (isCheckedIn) return;
    dispatch(checkInToday());
    setSelectedDate(todayKey);
    setElapsed(0);
  };

  const onCheckOut = () => {
    if (!isCheckedIn) return;
    dispatch(checkOutToday({ existingInIso: todayRec?.in }));
    setElapsed(0);
  };

  /* -------------------------- CALENDAR GRID ------------------------------- */
  const gridDays = useMemo(() => {
    const start = month.startOf("month");
    const end = month.endOf("month");
    const startGrid = start.startOf("isoWeek"); // Monday-start weeks
    const endGrid = end.endOf("isoWeek");
    const days = [];
    let cur = startGrid;
    while (cur.isBefore(endGrid) || cur.isSame(endGrid, "day")) {
      days.push(cur);
      cur = cur.add(1, "day");
    }
    return days;
  }, [month]);

  /* ------------------------------ STATUS ---------------------------------- */
  const getStatus = (key) => {
    const isFuture = dayjs(key).isAfter(dayjs(), "day");
    if (isFuture) return { label: "—", color: "bg-slate-300", code: "future" };

    const rec = records[key];
    if (!rec) return { label: "Absent", color: "bg-rose-500", code: "absent" };

    if (rec.in && !rec.out && dayjs(key).isBefore(dayjs(), "day")) {
      return { label: "Missing checkout", color: "bg-orange-500", code: "missing" };
    }
    if (rec.in && !rec.out && key === todayKey) {
      return { label: "In progress", color: "bg-amber-500", code: "progress" };
    }
    if (rec.totalMs > 0) return { label: "Present", color: "bg-emerald-600", code: "present" };
    return { label: "Absent", color: "bg-rose-500", code: "absent" };
  };

  const ariaLabelForDate = (key) => {
    const s = getStatus(key);
    const dateTxt = dayjs(key).format("dddd, DD MMM YYYY");
    const rec = records[key];
    const extra =
      rec?.totalMs
        ? `, total ${fmtDur(rec.totalMs)}`
        : s.code === "progress"
        ? ", running"
        : s.code === "missing"
        ? ", missing checkout"
        : "";
    return `${dateTxt}, ${s.label}${extra}`;
  };

  const selRec = records[selectedDate] || null;

  /* -------------------------------- UI ------------------------------------ */
  return (
    <div className="p-6 space-y-8">
      {/* Title */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 id="attendanceHeading" className="text-2xl font-extrabold tracking-tight text-slate-800">
            Employee Attendance
          </h1>
          <p className="text-sm text-slate-500">Track today’s time and browse your monthly history.</p>
        </div>

        {/* Today status pill */}
        <div
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            isCheckedIn ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-700"
          }`}
          aria-live="polite"
        >
          {isCheckedIn ? "Checked in" : "Not checked in"}
        </div>
      </div>

      {/* Check-in / out + timer */}
      <div className="flex flex-wrap items-center gap-4">
        {!isCheckedIn ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCheckIn}
            className="px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm"
            aria-label="Check in for today"
          >
            Check In
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCheckOut}
            className="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm"
            aria-label="Check out for today"
          >
            Check Out
          </motion.button>
        )}

        {/* live timer */}
        <div className="min-w-[220px] px-4 py-2 rounded-lg bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Today’s elapsed</div>
          <div className="font-mono text-lg text-indigo-700" aria-live="polite">
            {isCheckedIn ? fmtDur(elapsed) : "00:00:00"}
          </div>
        </div>

        {/* Today details */}
        <div className="px-4 py-2 rounded-lg bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Today</div>
          <div className="text-sm text-slate-700">
            In: <span className="font-medium">{fmtHM(todayRec?.in)}</span> &nbsp;|&nbsp; Out:{" "}
            <span className="font-medium">{fmtHM(todayRec?.out)}</span> &nbsp;|&nbsp; Total:{" "}
            <span className="font-medium">
              {todayRec?.totalMs
                ? fmtDur(todayRec.totalMs)
                : isCheckedIn || (todayRec?.in && !todayRec?.out)
                ? "—"
                : "00:00:00"}
            </span>
          </div>
        </div>

        {/* ROUTE to Leave Portal */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/employee/leave")}
          className="ml-auto px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
        >
          Apply Leave
        </motion.button>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="font-semibold text-slate-800">{month.format("MMMM YYYY")}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100"
              onClick={() => setMonth((m) => m.subtract(1, "month"))}
              aria-label="Previous month"
            >
              Prev
            </button>
            <button
              className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100"
              onClick={() => setMonth(dayjs().startOf("month"))}
              aria-label="Jump to current month"
            >
              Today
            </button>
            <button
              className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100"
              onClick={() => setMonth((m) => m.add(1, "month"))}
              aria-label="Next month"
            >
              Next
            </button>
          </div>
        </div>

        {/* Day names (Mon–Sun) */}
        <div className="grid grid-cols-7 text-xs text-slate-500 px-3 pt-3" role="row">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center pb-2" role="columnheader" aria-label={d}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 p-3" role="grid" aria-labelledby="attendanceHeading" aria-readonly="true">
          {gridDays.map((d) => {
            const key = d.format("YYYY-MM-DD");
            const inMonth = d.isSame(month, "month");
            const isToday = key === todayKey;
            const rec = records[key];
            const status = getStatus(key);
            const selected = key === selectedDate;

            const showDot =
              status.code === "present" || status.code === "progress" || status.code === "missing";
            const dotColor =
              status.code === "present"
                ? "bg-emerald-600"
                : status.code === "progress"
                ? "bg-amber-500"
                : status.code === "missing"
                ? "bg-orange-500"
                : "bg-transparent";

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedDate(key);
                  setPopupOpen(true);
                }}
                className={[
                  "relative h-20 rounded-lg p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  inMonth ? "bg-slate-50 hover:bg-slate-100" : "bg-slate-50/40 text-slate-400",
                  selected && "ring-2 ring-indigo-500",
                ].join(" ")}
                role="gridcell"
                aria-selected={selected}
                aria-current={isToday ? "date" : undefined}
                aria-label={ariaLabelForDate(key)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{d.date()}</span>
                  {isToday && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      Today
                    </span>
                  )}
                </div>

                {showDot && <span className={`absolute bottom-2 left-2 h-2 w-2 rounded-full ${dotColor}`} />}

                {rec && rec.totalMs > 0 && (
                  <div className="absolute bottom-2 right-2 text-[10px] text-slate-600">
                    {fmtDur(rec.totalMs)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="font-semibold text-slate-800">
            {dayjs(selectedDate).format("dddd, DD MMM YYYY")}
          </div>
        </div>

        {selRec ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-xs text-slate-500">Check-In</div>
              <div className="text-slate-800 font-medium">{fmtHM(selRec.in)}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-xs text-slate-500">Check-Out</div>
              <div className="text-slate-800 font-medium">{fmtHM(selRec.out)}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-xs text-slate-500">Total</div>
              <div className="text-slate-800 font-medium">
                {selRec.totalMs ? fmtDur(selRec.totalMs) : "00:00:00"}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">No record for this date (Absent).</div>
        )}
      </div>

      {/* POPUP: Day details */}
      <AnimatePresence>
        {popupOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPopupOpen(false)}
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="font-semibold text-slate-800">
                  {dayjs(selectedDate).format("dddd, DD MMM YYYY")}
                </div>
                <div className="text-sm text-slate-600">{getStatus(selectedDate).label}</div>
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
                  <div className="text-sm text-slate-600">
                    No record for this date. Status: <b>Absent</b>.
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-slate-200 flex justify-end">
                <button
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
                  onClick={() => setPopupOpen(false)}
                  aria-label="Close details"
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
