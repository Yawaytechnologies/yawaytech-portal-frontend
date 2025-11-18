// src/pages/LeaveReport.jsx
import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";

const fmtDate = (d) => dayjs(d).format("DD MMM YYYY");
const formatDays = (n) => `${n} day${n === 1 ? "" : "s"}`;
const EASE = [0.22, 1, 0.36, 1];

/* ───────── outside-click + ESC hook ───────── */
function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const handleDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [ref, onClose]);
}

/* ───────────────── Month dropdown (compact) ───────────────── */

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function MonthDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  useOutsideClose(boxRef, () => setOpen(false));

  const current = value || dayjs().startOf("month");
  const [tempYear, setTempYear] = useState(current.year());

  useEffect(() => {
    setTempYear(current.year());
  }, [current]);

  const handleSelect = (monthIndex) => {
    const next = dayjs()
      .year(tempYear)
      .month(monthIndex)
      .startOf("month");
    onChange?.(next);
    setOpen(false);
  };

  const handleClear = () => {
    const next = dayjs().year(tempYear).month(0).startOf("month");
    onChange?.(next);
    setOpen(false);
  };

  const handleThisMonth = () => {
    const t = dayjs().startOf("month");
    onChange?.(t);
    setTempYear(t.year());
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      {/* trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 pr-3 text-[11px] md:text-xs text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span>{current.format("MMMM YYYY")}</span>
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 text-slate-500"
          fill="none"
          stroke="currentColor"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
        </svg>
      </button>

      {/* compact popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: EASE }}
            className="absolute right-0 z-40 mt-1 w-[220px] rounded-lg border border-slate-200 bg-white shadow-xl"
          >
            {/* year bar */}
            <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2">
              <button
                type="button"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                onClick={() => setTempYear((y) => y - 1)}
              >
                ‹
              </button>
              <div className="rounded-md bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-800">
                {tempYear}
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                onClick={() => setTempYear((y) => y + 1)}
              >
                ›
              </button>
            </div>

            {/* months grid */}
            <div className="grid grid-cols-4 gap-x-3 gap-y-2 px-3 py-2.5 text-[11px]">
              {MONTH_LABELS.map((label, idx) => {
                const isSelected =
                  current.year() === tempYear && current.month() === idx;
                const isThisMonth =
                  dayjs().year() === tempYear && dayjs().month() === idx;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    className={[
                      "h-7 rounded-md text-center leading-7 transition-colors",
                      "text-slate-800 hover:bg-slate-100",
                      isSelected &&
                        "bg-indigo-600 text-white shadow-sm hover:bg-indigo-600",
                      !isSelected && isThisMonth && "border border-indigo-200",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* footer actions */}
            <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-[11px]">
              <button
                type="button"
                className="text-indigo-600 hover:underline"
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="button"
                className="text-indigo-600 hover:underline"
                onClick={handleThisMonth}
              >
                This month
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────── Year dropdown (for Annual mode) ───────────────── */

function YearDropdown({ year, options, onChange }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  useOutsideClose(boxRef, () => setOpen(false));

  const handleSelect = (y) => {
    onChange?.(y);
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 pr-6 text-[11px] md:text-xs text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span>{year}</span>
        <span className="pointer-events-none absolute right-2 inset-y-0 my-auto flex h-3 w-3 items-center justify-center text-slate-500">
          <svg
            viewBox="0 0 20 20"
            className={`h-3 w-3 transition-transform ${
              open ? "rotate-180" : "rotate-0"
            }`}
            fill="currentColor"
          >
            <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
          </svg>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: EASE }}
            className="absolute right-0 z-40 mt-1 max-h-64 min-w-[90px] overflow-auto rounded-md border border-slate-200 bg-white py-1 text-[11px] md:text-xs shadow-xl"
          >
            {options.map((y) => {
              const selected = y === year;
              return (
                <li key={y}>
                  <button
                    type="button"
                    onClick={() => handleSelect(y)}
                    className={[
                      "flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors",
                      selected
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <span>{y}</span>
                    {selected && (
                      <span className="text-[10px] text-indigo-500">✓</span>
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────── MAIN COMPONENT ────────────────────────── */

export default function LeaveReport() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // month from state or current month
  const initialMonth = state?.month
    ? dayjs(state.month)
    : dayjs().startOf("month");

  const [mode, setMode] = useState(state?.mode ?? "monthly"); // "monthly" | "annual"
  const [month, setMonth] = useState(initialMonth);

  // all leaves from state or fallback demo so page doesn't crash
  const allLeaves = state?.leaves ?? [
    {
      id: "REQ1026",
      type: "CL",
      from: "2025-11-01",
      to: "2025-11-01",
      days: 1,
      status: "approved",
      reason: "Personal",
    },
  ];

  /* ------------------------ year options & state ------------------------ */

  const yearOptions = useMemo(() => {
    const yearsSet = new Set();
    allLeaves.forEach((l) => {
      const from = dayjs(l.from);
      const to = dayjs(l.to || l.from);
      if (from.isValid()) yearsSet.add(from.year());
      if (to.isValid()) yearsSet.add(to.year());
    });
    if (!yearsSet.size) yearsSet.add(dayjs().year());
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [allLeaves]);

  const [year, setYear] = useState(initialMonth.year());

  /* ----------------------------- monthly view ----------------------------- */

  const monthLeaves = useMemo(() => {
    const startOfMonth = month.startOf("month");
    const endOfMonth = month.endOf("month");

    return allLeaves.filter((l) => {
      const from = dayjs(l.from);
      const to = dayjs(l.to || l.from);
      return (
        !to.isBefore(startOfMonth, "day") && !from.isAfter(endOfMonth, "day")
      );
    });
  }, [allLeaves, month]);

  const monthStats = useMemo(() => {
    let total = 0;
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    const typeMap = {};

    monthLeaves.forEach((l) => {
      const days = Number(l.days) || 0;
      total += days;

      if (l.status === "approved") approved += days;
      else if (l.status === "pending") pending += days;
      else if (l.status === "rejected") rejected += days;

      const key = l.type || "NA";
      typeMap[key] = (typeMap[key] || 0) + days;
    });

    return { total, approved, pending, rejected, typeMap };
  }, [monthLeaves]);

  const monthTypeEntries = Object.entries(monthStats.typeMap);

  /* ----------------------------- annual view ----------------------------- */

  const yearLeaves = useMemo(() => {
    const startOfYear = dayjs(`${year}-01-01`);
    const endOfYear = dayjs(`${year}-12-31`);

    return allLeaves.filter((l) => {
      const from = dayjs(l.from);
      const to = dayjs(l.to || l.from);
      return (
        !to.isBefore(startOfYear, "day") && !from.isAfter(endOfYear, "day")
      );
    });
  }, [allLeaves, year]);

  const yearStats = useMemo(() => {
    let total = 0;
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    const typeMap = {};

    yearLeaves.forEach((l) => {
      const days = Number(l.days) || 0;
      total += days;

      if (l.status === "approved") approved += days;
      else if (l.status === "pending") pending += days;
      else if (l.status === "rejected") rejected += days;

      const key = l.type || "NA";
      typeMap[key] = (typeMap[key] || 0) + days;
    });

    return { total, approved, pending, rejected, typeMap };
  }, [yearLeaves]);

  const yearTypeEntries = Object.entries(yearStats.typeMap);

  /* ------------------------------ render UI ------------------------------ */

  return (
    <div className="p-4 md:p-5 space-y-4 md:space-y-5 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-800">
            Leave Reports
          </h1>
          <p className="mt-0.5 text-[11px] md:text-xs text-slate-500">
            View your leave usage by month or full year.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-start md:justify-end">
          {/* Monthly / Annual toggle */}
          <div className="inline-flex rounded-md border border-slate-200 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setMode("monthly")}
              className={[
                "px-3 py-1 font-medium transition",
                "border-r border-slate-200",
                mode === "monthly"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-900 hover:bg-slate-50",
              ].join(" ")}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setMode("annual")}
              className={[
                "px-3 py-1 font-medium transition",
                mode === "annual"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-900 hover:bg-slate-50",
              ].join(" ")}
            >
              Annual
            </button>
          </div>

          {/* Controls: month / year */}
          {mode === "monthly" ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] md:text-xs text-slate-600">
                Month
              </span>
              <MonthDropdown
                value={month}
                onChange={(next) => {
                  setMonth(next);
                  setYear(next.year());
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] md:text-xs text-slate-600">
                Year
              </span>
              <YearDropdown
                year={year}
                options={yearOptions}
                onChange={setYear}
              />
            </div>
          )}

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center px-3 md:px-3.5 py-1.5 text-[11px] md:text-xs font-medium rounded-md border border-slate-200 text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* ===================== MONTHLY VIEW ===================== */}
      {mode === "monthly" && (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm px-3 py-2.5 flex flex-col justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Total leave days
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {monthStats.total}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {month.format("MMMM YYYY")}
              </div>
            </div>

            {/* Approved */}
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 shadow-sm px-3 py-2.5 flex flex-col justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Approved
              </div>
              <div className="mt-1 text-lg font-semibold text-emerald-900">
                {monthStats.approved}
              </div>
              <div className="text-[10px] text-emerald-700/80 mt-0.5">
                {formatDays(monthStats.approved)}
              </div>
            </div>

            {/* Pending */}
            <div className="rounded-lg border border-amber-100 bg-amber-50/70 shadow-sm px-3 py-2.5 flex flex-col justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Pending
              </div>
              <div className="mt-1 text-lg font-semibold text-amber-900">
                {monthStats.pending}
              </div>
              <div className="text-[10px] text-amber-700/80 mt-0.5">
                {formatDays(monthStats.pending)}
              </div>
            </div>

            {/* Rejected */}
            <div className="rounded-lg border border-rose-100 bg-rose-50/70 shadow-sm px-3 py-2.5 flex flex-col justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                Rejected
              </div>
              <div className="mt-1 text-lg font-semibold text-rose-900">
                {monthStats.rejected}
              </div>
              <div className="text-[10px] text-rose-700/80 mt-0.5">
                {formatDays(monthStats.rejected)}
              </div>
            </div>
          </div>

          {/* BREAKDOWN BY TYPE */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm px-3.5 md:px-4 py-3">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Leave by type (month)
                </h2>
                <p className="text-[10px] text-slate-500">
                  Days used by leave type in {month.format("MMMM YYYY")}.
                </p>
              </div>
            </div>

            {monthTypeEntries.length === 0 ? (
              <p className="text-xs text-slate-500">No leave in this month.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {monthTypeEntries.map(([type, days]) => (
                  <div
                    key={type}
                    className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="text-[11px] font-medium text-slate-600">
                      {type}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">
                      {days}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formatDays(days)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TABLE */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-3.5 md:px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Detailed leave history (month)
                </h2>
                <p className="text-[10px] text-slate-500">
                  Requests that fall in {month.format("MMMM YYYY")}.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] md:text-xs">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      Req.ID
                    </th>
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      Type
                    </th>
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      From
                    </th>
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      To
                    </th>
                    <th className="px-3.5 py-2 text-right font-semibold text-slate-600">
                      Days
                    </th>
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthLeaves.length === 0 && (
                    <tr>
                      <td
                        className="px-3.5 py-3 text-slate-500 text-center"
                        colSpan={7}
                      >
                        No leave records for this month.
                      </td>
                    </tr>
                  )}

                  {monthLeaves.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={
                        "border-t border-slate-100 " +
                        (idx % 2 === 0 ? "bg-white" : "bg-slate-50/60")
                      }
                    >
                      <td className="px-3.5 py-2.5 font-mono text-[10px] text-slate-800">
                        {r.id}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800">
                        {r.type}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800">
                        {fmtDate(r.from)}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800">
                        {fmtDate(r.to || r.from)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-slate-800">
                        {r.days}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] capitalize " +
                            (r.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : r.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100")
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {r.reason || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===================== ANNUAL VIEW ===================== */}
      {mode === "annual" && (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm px-3 py-2.5 flex flex-col justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Total leave days
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {yearStats.total}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Year {year}
              </div>
            </div>

            {/* Approved */}
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 shadow-sm px-3 py-2.5 flex flex-col justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Approved
              </div>
              <div className="mt-1 text-lg font-semibold text-emerald-900">
                {yearStats.approved}
              </div>
              <div className="text-[10px] text-emerald-700/80 mt-0.5">
                {formatDays(yearStats.approved)}
              </div>
            </div>

            {/* Pending */}
            <div className="rounded-lg border border-amber-100 bg-amber-50/70 shadow-sm px-3 py-2.5 flex flex-col justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Pending
              </div>
              <div className="mt-1 text-lg font-semibold text-amber-900">
                {yearStats.pending}
              </div>
              <div className="text-[10px] text-amber-700/80 mt-0.5">
                {formatDays(yearStats.pending)}
              </div>
            </div>

            {/* Rejected */}
            <div className="rounded-lg border border-rose-100 bg-rose-50/70 shadow-sm px-3 py-2.5 flex flex-col justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                Rejected
              </div>
              <div className="mt-1 text-lg font-semibold text-rose-900">
                {yearStats.rejected}
              </div>
              <div className="text-[10px] text-rose-700/80 mt-0.5">
                {formatDays(yearStats.rejected)}
              </div>
            </div>
          </div>

          {/* BREAKDOWN BY TYPE */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm px-3.5 md:px-4 py-3">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Leave by type (year)
                </h2>
                <p className="text-[10px] text-slate-500">
                  Total days per leave type in {year}.
                </p>
              </div>
            </div>

            {yearTypeEntries.length === 0 ? (
              <p className="text-xs text-slate-500">No leave in this year.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {yearTypeEntries.map(([type, days]) => (
                  <div
                    key={type}
                    className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="text-[11px] font-medium text-slate-600">
                      {type}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">
                      {days}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formatDays(days)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TABLE */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-3.5 md:px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Detailed leave history (year)
                </h2>
                <p className="text-[10px] text-slate-500">
                  Requests that fall in {year}.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] md:text-xs">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      Req.ID
                    </th>
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      Type
                    </th>
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      From
                    </th>
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      To
                    </th>
                    <th className="px-3.5 py-2 text-right font-semibold text-slate-600">
                      Days
                    </th>
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-3.5 py-2 text-left font-semibold text-slate-600">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {yearLeaves.length === 0 && (
                    <tr>
                      <td
                        className="px-3.5 py-3 text-slate-500 text-center"
                        colSpan={7}
                      >
                        No leave records for this year.
                      </td>
                    </tr>
                  )}

                  {yearLeaves.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={
                        "border-t border-slate-100 " +
                        (idx % 2 === 0 ? "bg-white" : "bg-slate-50/60")
                      }
                    >
                      <td className="px-3.5 py-2.5 font-mono text-[10px] text-slate-800">
                        {r.id}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800">
                        {r.type}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800">
                        {fmtDate(r.from)}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800">
                        {fmtDate(r.to || r.from)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-slate-800">
                        {r.days}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] capitalize " +
                            (r.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : r.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100")
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {r.reason || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
