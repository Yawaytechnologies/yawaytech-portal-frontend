import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdClose, MdSchedule } from "react-icons/md";

import { fetchCurrentShift } from "../../redux/actions/shiftActions";

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

  const [targetDate, setTargetDate] = useState(todayLocalISO());

  useEffect(() => {
    if (open) setTargetDate(todayLocalISO());
  }, [open]);

  useEffect(() => {
    if (!open || !employeeId) return;

    dispatch(
      fetchCurrentShift({
        employeeId: String(employeeId),
        targetDate,
      })
    );
  }, [open, employeeId, targetDate, dispatch]);

  const currentView = useMemo(() => {
    const c = current || {};
    return {
      name: c.name || "—",
      start_time: shortTime(c.start_time),
      end_time: shortTime(c.end_time),
      total_hours: c.total_hours ?? "—",
    };
  }, [current]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-black/50 backdrop-blur-sm px-3 py-3 sm:px-4 sm:py-4">
      <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col">

        {/* 🔥 BLUE HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b bg-gradient-to-r from-[#0e1b34] to-[#1d3b8b] text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-white/10">
              <MdSchedule className="text-xl" />
            </span>

            <div className="leading-tight">
              <div className="font-bold text-base sm:text-lg">
                Shift
              </div>
              <div className="text-xs text-white/70">
                Employee: {employeeId}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid place-items-center w-9 h-9 rounded-full hover:bg-white/10 transition"
            type="button"
          >
            <MdClose className="text-xl text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-5 py-4 space-y-4 overflow-y-auto flex-1 bg-white">

          {/* Target Date */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-xs font-semibold text-gray-600">
              Target Date
            </div>

            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full md:w-auto rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white text-[#0e1b34]"
            />
          </div>

          {/* Shift Card */}
          <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-4 sm:p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
              <div className="text-[#0e1b34] text-2xl font-bold">
                {loadingCurrent ? "Loading..." : currentView.name}
              </div>

              <div className="text-sm font-medium text-gray-500">
                {targetDate}
              </div>
            </div>

            {/* 🔥 Responsive Grid */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Start" value={loadingCurrent ? "..." : currentView.start_time} />
              <Field label="End" value={loadingCurrent ? "..." : currentView.end_time} />
              <Field label="Total Hours" value={loadingCurrent ? "..." : currentView.total_hours} />
            </div>
          </div>

          {/* Error */}
          {!loadingCurrent && error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {String(error)}
            </div>
          ) : null}
        </div>

       
      </div>
    </div>,
    document.body
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 min-h-[96px] flex flex-col justify-center">
      <div className="text-sm font-semibold text-[#667085]">{label}</div>
      <div className="mt-2 text-[18px] font-bold text-[#0e1b34] break-words">
        {String(value)}
      </div>
    </div>
  );
}