import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdClose, MdSchedule } from "react-icons/md";

import { fetchCurrentShift } from "../../redux/actions/shiftActions";

// ✅ use LOCAL date (NOT toISOString which is UTC)
const todayLocalISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const shortTime = (t) => {
  if (!t) return "—";
  const s = String(t);
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  return `${String(m[1]).padStart(2, "0")}:${m[2]}`;
};

export default function ShiftModal({ open, onClose, employeeId }) {
  const dispatch = useDispatch();

  const { current, loadingCurrent, error } = useSelector((s) => s.shift || {});

  // ✅ user can change this date to see shift
  const [targetDate, setTargetDate] = useState(todayLocalISO());

  // ✅ reset date when modal opens
  useEffect(() => {
    if (open) setTargetDate(todayLocalISO());
  }, [open]);

  // ✅ fetch on open + when date changes
  useEffect(() => {
    if (!open || !employeeId) return;
    dispatch(
      fetchCurrentShift({
        employeeId: String(employeeId),
        targetDate,
      }),
    );
  }, [open, employeeId, targetDate, dispatch]);

  const currentView = useMemo(() => {
    const c = current || {};
    return {
      name: c.name || "—",
      start_time: shortTime(c.start_time),
      end_time: shortTime(c.end_time),
      total_hours: c.total_hours ?? "—",
      is_night: typeof c.is_night === "boolean" ? (c.is_night ? "Yes" : "No") : "—",
    };
  }, [current]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-black/50 backdrop-blur-sm px-3">
      <div className="w-full max-w-xl max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-orange-50 border border-orange-200">
              <MdSchedule className="text-[#FF5800] text-xl" />
            </span>
            <div className="leading-tight">
              <div className="font-bold text-[#0e1b34]">Shift</div>
              <div className="text-xs text-gray-500">Employee: {employeeId}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid place-items-center w-9 h-9 rounded-full hover:bg-gray-100"
            type="button"
          >
            <MdClose className="text-xl text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* ✅ Target date picker */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-gray-600">Target Date</div>
              
            </div>
            <input
  type="date"
  value={targetDate}
  onChange={(e) => setTargetDate(e.target.value)}
  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white text-[#0e1b34]"
/>
          </div>

          {/* Current shift */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-[#0e1b34]">
                {loadingCurrent ? "Loading..." : currentView.name}
              </div>
              <div className="text-xs text-gray-500">{targetDate}</div>
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <Row label="Start" value={loadingCurrent ? "..." : currentView.start_time} />
              <Row label="End" value={loadingCurrent ? "..." : currentView.end_time} />
              <Row
                label="Total Hours"
                value={loadingCurrent ? "..." : currentView.total_hours}
              />
              <Row label="Night" value={loadingCurrent ? "..." : currentView.is_night} />
            </div>
          </div>

          {/* ✅ show 404 message nicely (no confusion) */}
          {!loadingCurrent && error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {String(error)}
            </div>
          ) : null}
        </div>

     
      </div>
    </div>,
    document.body,
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <span className="text-sm font-medium text-[#0e1b34]">{String(value)}</span>
    </div>
  );
}