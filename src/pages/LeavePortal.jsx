// src/pages/LeavePortal.jsx
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import LeaveForm from "../components/EmployeeLeave/LeaveForm";
import { fetchLeaveTypes, applyLeave } from "../redux/actions/leaveActions";

dayjs.extend(isoWeek);
const fmt = (d) => dayjs(d).format("DD MMM YYYY");

// helper to show "1 day" / "2 days"
const formatDays = (n) => `${n} day${n === 1 ? "" : "s"}`;

export default function LeavePortal() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 🔹 Employee ID (adjust selector to your auth slice)
  const employeeId = useSelector(
    (s) => s.auth?.employee?.employeeId || "YTPL002MA"
  );

const leaveState = useSelector((s) => s.leave);

const {
  types = [],
  typesStatus = "idle",
  typesError = null,
  applyStatus = "idle",
  applyError = null,
} = leaveState || {};



  const [leaves, setLeaves] = useState([]);

  const [view, setView] = useState("calendar"); // "calendar" | "table"
  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [open, setOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null); // for tooltip on calendar

  /* ----------------------------- helpers ----------------------------- */

  // addLeave → UI only (local state)
  const addLeave = (rec) => {
    if (!rec) {
      toast.error("Failed to submit leave request.", {
        toastId: "leave-submit-error",
      });
      return;
    }

    // UI code (what we use in calendar: EL/CL/SL/PR/others)
    const uiType = String(
      rec.type || rec.leave_type || rec.backendType || "CL"
    ).toUpperCase();

    // exact backend code
    const backendType = String(
      rec.backendType || rec.leave_type || uiType
    ).toUpperCase();

    const backendName = rec.backendName || "";
    const reason = rec.reason || rec.note || rec.reasonText || "";

    // label for table: "SL — Sick Leave", "EL — Earned Leave", etc.
    const typeLabel = backendName
      ? `${uiType} — ${backendName}`
      : uiType === "PR"
      ? "PR — Permission"
      : uiType;

    const id = "REQ" + Math.random().toString(36).slice(2, 8).toUpperCase();

    // Permission (PR)
    if (uiType === "PR") {
      const date =
        rec.date ||
        rec.permission_date ||
        rec.perm_date ||
        rec.from ||
        rec.start_date ||
        dayjs().format("YYYY-MM-DD");

      const dateD = dayjs(date || dayjs());

      setLeaves((s) => [
        {
          id,
          type: "PR",
          backendType,
          typeLabel,
          from: dateD.format("YYYY-MM-DD"),
          to: dateD.format("YYYY-MM-DD"),
          days: 0,
          status: "pending",
          reason,
          permissionMode: rec.permissionMode || rec.permission_mode || "",
          minutes: rec.minutes ?? 0,
        },
        ...s,
      ]);

      toast.success("Leave request submitted.", {
        toastId: `leave-submit-${id}`,
      });
      return;
    }

    // Full-day leave (EL / CL / SL / other codes)
    const from = rec.from || rec.start_date || rec.date_from;
    const to = rec.to || rec.end_date || rec.date_to || from;

    const fromD = dayjs(from || dayjs());
    const toD = dayjs(to || fromD);

    const diffDays = toD.diff(fromD, "day");
    const days = Number.isFinite(diffDays) ? Math.max(diffDays + 1, 1) : 1;

    setLeaves((s) => [
      {
        id,
        type: uiType,
        backendType,
        typeLabel,
        from: fromD.format("YYYY-MM-DD"),
        to: toD.format("YYYY-MM-DD"),
        days,
        status: "pending",
        reason,
        minutes: 0,
      },
      ...s,
    ]);

    toast.success("Leave request submitted.", {
      toastId: `leave-submit-${id}`,
    });
  };

  // revert (only works for non-approved; approved button is disabled)
  const revertLeave = (id) => {
    setLeaves((prev) => {
      const target = prev.find((l) => l.id === id);
      if (!target || target.status === "approved") {
        return prev;
      }

      toast.error("Leave request reverted.", {
        toastId: `leave-revert-${id}`,
      });

      return prev.filter((l) => l.id !== id);
    });
  };

  // calendar grid (Sunday → Saturday)
  const gridDays = useMemo(() => {
    const start = month.startOf("month");
    const end = month.endOf("month");
    const startGrid = start.startOf("week"); // Sunday
    const endGrid = end.endOf("week");
    const days = [];
    let cur = startGrid;
    while (cur.isBefore(endGrid) || cur.isSame(endGrid, "day")) {
      days.push(cur);
      cur = cur.add(1, "day");
    }
    return days;
  }, [month]);

  // taken leaves (for indicator + type labels)
  const leaveDates = new Set();
  const leavesByDate = new Map();
  leaves.forEach((l) => {
    let d = dayjs(l.from);
    const last = dayjs(l.to || l.from);
    while (d.isBefore(last) || d.isSame(last, "day")) {
      const key = d.format("YYYY-MM-DD");
      leaveDates.add(key);
      const arr = leavesByDate.get(key) || [];
      arr.push(l);
      leavesByDate.set(key, arr);
      d = d.add(1, "day");
    }
  });

  // monthly stats (for right panel)
  const monthStats = useMemo(() => {
    const startOfMonth = month.startOf("month");
    const endOfMonth = month.endOf("month");

    let totalDaysInMonth = 0; // full-day leaves only (EL/CL/SL)
    let approvedDaysInMonth = 0; // approved full-day leaves
    let companyHolidays = 0;
    let govtHolidays = 0;

    const typeDays = { EL: 0, CL: 0, SL: 0 };
    let permissionCount = 0;

    // real leave days
    leaves.forEach((l) => {
      const from = dayjs(l.from);
      const to = dayjs(l.to || l.from);
      const type = String(l.type || "").toUpperCase();

      const start = from.isAfter(startOfMonth) ? from : startOfMonth;
      const end = to.isBefore(endOfMonth) ? to : endOfMonth;

      if (end.isBefore(start, "day")) return;

      const days = end.diff(start, "day") + 1;

      if (type === "PR") {
        if (days > 0) permissionCount += 1;
      } else if (type === "EL" || type === "CL" || type === "SL") {
        totalDaysInMonth += days;
        typeDays[type] += days;
        if (l.status === "approved") {
          approvedDaysInMonth += days;
        }
      }
    });

    // dummy holiday pattern for every month:
    // Govt: 2nd & 16th, Company: 8th & 22nd
    let cur = startOfMonth;
    while (cur.isBefore(endOfMonth) || cur.isSame(endOfMonth, "day")) {
      const dayNum = cur.date();
      if (dayNum === 2 || dayNum === 16) govtHolidays += 1;
      if (dayNum === 8 || dayNum === 22) companyHolidays += 1;
      cur = cur.add(1, "day");
    }

    return {
      totalDaysInMonth,
      approvedDaysInMonth,
      companyHolidays,
      govtHolidays,
      typeDays,
      permissionCount,
    };
  }, [leaves, month]);

  const typeBadgeClass = (code) => {
    switch (code) {
      case "EL":
        return "bg-sky-500";
      case "CL":
        return "bg-indigo-500";
      case "SL":
        return "bg-rose-500";
      case "PR":
        return "bg-amber-500";
      default:
        return "bg-slate-400";
    }
  };

  /* ----------------------------- handlers ----------------------------- */

  const handleOpenApply = () => {
    setOpen(true);
  };
  const ensureTypesLoaded = () => {
  if (typesStatus === "idle" || typesStatus === "failed") {
    dispatch(fetchLeaveTypes());
  }
};


  const handleSubmitForm = (rec) => {
    if (!employeeId) {
      toast.error("Employee ID missing. Cannot apply leave.");
      return;
    }

    // rec contains: type, backendType, backendName, etc. from LeaveForm
    dispatch(applyLeave({ employeeId, rec }))
      .unwrap()
      .then(() => {
        addLeave(rec); // update local calendar/table
        setOpen(false); // close modal after successful submit
      })
      .catch((err) => {
        const msg =
          err?.message ||
          applyError ||
          "Failed to apply leave. Please try again.";
        toast.error(msg);
      });
  };

  /* ----------------------------- layout ----------------------------- */

  return (
    <div className="p-4 md:p-5 space-y-4 md:space-y-5 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-800">
            Leave Portal
          </h1>
          <p className="mt-0.5 text-[11px] md:text-xs text-slate-500">
            Apply for leave and track status.
          </p>
        </div>

        {/* RIGHT SIDE: tabs + actions all in one row (wrap on mobile) */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-start md:justify-end">
          {/* segmented control (Calendar / Status) */}
          <div className="inline-flex rounded-md border border-slate-200 overflow-hidden text-xs">
            <button
              onClick={() => setView("calendar")}
              className={[
                "px-3 py-1.5 font-medium transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                "border-r border-slate-200",
                view === "calendar"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-900 hover:bg-slate-50",
              ].join(" ")}
            >
              Calendar
            </button>
            <button
              onClick={() => setView("table")}
              className={[
                "px-3 py-1.5 font-medium transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                view === "table"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-900 hover:bg-slate-50",
              ].join(" ")}
            >
              Status
            </button>
          </div>

          {/* Apply */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenApply}
            className="inline-flex items-center justify-center px-3 md:px-3.5 py-1.5 text-[11px] md:text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Apply
          </motion.button>

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center px-3 md:px-3.5 py-1.5 text-[11px] md:text-xs font-medium rounded-md border border-slate-200 text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Back"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {view === "calendar" && (
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-stretch">
          {/* CALENDAR CARD */}
          <div className="w-full lg:flex-[1.05] rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between px-3.5 py-1.5 border-b border-slate-200 bg-slate-50">
              <div className="font-semibold text-slate-800 text-sm">
                {month.format("MMMM YYYY")}
              </div>
              <div className="flex w-full sm:w-auto items-center gap-1.5 justify-between sm:justify-end">
                {/* smaller nav buttons */}
                <button
                  className="inline-flex items-center justify-center px-2.5 md:px-3 py-1 text-[10px] rounded-md bg-white border border-slate-200 hover:bg-slate-100"
                  onClick={() => setMonth((m) => m.subtract(1, "month"))}
                >
                  Prev
                </button>
                <button
                  className="inline-flex items-center justify-center px-2.5 md:px-3 py-1 text-[10px] rounded-md bg-white border border-slate-200 hover:bg-slate-100"
                  onClick={() => setMonth(dayjs().startOf("month"))}
                >
                  Today
                </button>
                <button
                  className="inline-flex items-center justify-center px-2.5 md:px-3 py-1 text-[10px] rounded-md bg-white border border-slate-200 hover:bg-slate-100"
                  onClick={() => setMonth((m) => m.add(1, "month"))}
                >
                  Next
                </button>
              </div>
            </div>

            {/* body */}
            <div className="flex-1 px-3 md:px-3.5 pt-1 pb-2 flex flex-col">
              <div className="grid grid-cols-7 text-[10px] text-slate-500 pb-0.5">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center">
                    {d}
                  </div>
                ))}
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-7 gap-[1px] h-full">
                  {gridDays.map((d) => {
                    const key = d.format("YYYY-MM-DD");
                    const inMonth = d.isSame(month, "month");
                    const dayNum = d.date();

                    // dummy pattern: govt/company holidays per month
                    let indicator = null;
                    if (dayNum === 2 || dayNum === 16) indicator = "govt";
                    else if (dayNum === 8 || dayNum === 22)
                      indicator = "company";

                    const dayLeaves = leavesByDate.get(key) || [];

                    // any real leave
                    const hasTaken = leaveDates.has(key);
                    if (hasTaken) {
                      const hasPermission = dayLeaves.some(
                        (l) => String(l.type || "").toUpperCase() === "PR"
                      );
                      indicator = hasPermission ? "perm" : "taken";
                    }

                    const dotClass =
                      indicator === "govt"
                        ? "bg-rose-500"
                        : indicator === "company"
                        ? "bg-amber-500"
                        : indicator === "taken"
                        ? "bg-indigo-500"
                        : indicator === "perm"
                        ? "bg-amber-500"
                        : "";

                    const labelText =
                      indicator === "govt"
                        ? "Govt holiday"
                        : indicator === "company"
                        ? "Company holiday"
                        : indicator === "perm"
                        ? "Permission"
                        : "Taken leave";

                    const typeCodes = [
                      ...new Set(
                        dayLeaves.map((l) => String(l.type || "").toUpperCase())
                      ),
                    ];

                    return (
                      <div
                        key={key}
                        className={[
                          "relative rounded-md",
                          "h-7 md:h-8",
                          inMonth
                            ? "bg-slate-50 hover:bg-slate-100"
                            : "bg-slate-50/40 text-slate-400",
                        ].join(" ")}
                        onMouseEnter={() => indicator && setHoveredDay(key)}
                        onMouseLeave={() =>
                          hoveredDay === key && setHoveredDay(null)
                        }
                      >
                        {/* Day number */}
                        <div className="absolute top-1 left-1 text-[9px] font-medium">
                          {d.date()}
                        </div>

                        {/* Holiday / taken / permission dot */}
                        {indicator && (
                          <span
                            className={`absolute bottom-1 left-1 h-1.5 w-1.5 rounded-full ${dotClass}`}
                          />
                        )}

                        {/* Leave type badges (EL / CL / SL / PR / others) */}
                        {typeCodes.length > 0 && (
                          <div className="absolute bottom-1 right-1 flex flex-wrap gap-[2px] justify-end">
                            {typeCodes.slice(0, 3).map((code) => (
                              <span
                                key={code}
                                className={`px-1 rounded-full text-[8px] font-semibold text-white ${typeBadgeClass(
                                  code
                                )}`}
                              >
                                {code === "PR" ? "Perm" : code}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Tooltip */}
                        {indicator && hoveredDay === key && (
                          <div className="pointer-events-none absolute inset-x-1 bottom-1 rounded-md bg-slate-900/90 text-[9px] text-white px-1.5 py-0.5 flex items-center gap-1 justify-center shadow-md">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${dotClass}`}
                            />
                            <span>{labelText}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SUMMARY PANEL */}
          <div className="w-full lg:w-[320px]">
            <div className="h-full rounded-lg border border-slate-200 bg-white shadow-sm px-3.5 md:px-4 py-3 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Monthly Overview
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {month.format("MMMM YYYY")}
                  </p>
                </div>
              </div>

              <div className="mt-1.5 flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  {/* Total leave */}
                  <div className="text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      <span className="text-slate-600">
                        Total leave (EL/CL/SL)
                      </span>
                    </div>
                    <div className="mt-0.5 ml-3 text-xs font-medium text-slate-900">
                      {formatDays(monthStats.totalDaysInMonth)}
                    </div>
                  </div>

                  {/* Approved leave */}
                  <div className="text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">Approved leave</span>
                    </div>
                    <div className="mt-0.5 ml-3 text-xs font-medium text-slate-900">
                      {formatDays(monthStats.approvedDaysInMonth)}
                    </div>
                  </div>

                  {/* Company holidays */}
                  <div className="text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-slate-600">Company holidays</span>
                    </div>
                    <div className="mt-0.5 ml-3 text-xs font-medium text-slate-900">
                      {formatDays(monthStats.companyHolidays)}
                    </div>
                  </div>

                  {/* Govt holidays */}
                  <div className="text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      <span className="text-slate-600">Govt holidays</span>
                    </div>
                    <div className="mt-0.5 ml-3 text-xs font-medium text-slate-900">
                      {formatDays(monthStats.govtHolidays)}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* BY LEAVE TYPE */}
                <div className="space-y-2">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    By leave type
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {["EL", "CL", "SL"].map((code) => (
                      <div key={code} className="flex gap-1.5 text-[11px]">
                        <span
                          className={
                            "mt-1 h-2 w-2 rounded-full " + typeBadgeClass(code)
                          }
                        />
                        <div className="text-slate-600">
                          <div>
                            {code === "EL"
                              ? "Earned (EL)"
                              : code === "CL"
                              ? "Casual (CL)"
                              : "Sick (SL)"}
                          </div>
                          <div className="mt-0.5 text-xs font-medium text-slate-900">
                            {formatDays(monthStats.typeDays?.[code] || 0)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Permission cell */}
                    <div className="flex gap-1.5 text-[11px]">
                      <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                      <div className="text-slate-600">
                        <div>Permission</div>
                        <div className="mt-0.5 text-xs font-medium text-slate-900">
                          {monthStats.permissionCount || 0} req(s)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* bottom report button */}
              <div className="pt-2 mt-2 border-t border-slate-100 flex justify-start">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 text-[11px] font-medium rounded-md border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  onClick={() =>
                    navigate("/leave-report", {
                      state: {
                        month: month.toISOString(),
                        leaves,
                        mode: "monthly",
                      },
                    })
                  }
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLE VIEW */}
      {view === "table" && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
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
                  <th className="px-3.5 py-2 text-right font-semibold text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 && (
                  <tr>
                    <td
                      className="px-3.5 py-3 text-slate-500 text-center"
                      colSpan={8}
                    >
                      No requests yet.
                    </td>
                  </tr>
                )}
                {leaves.map((r, idx) => {
                  const isApproved = r.status === "approved";
                  return (
                    <tr
                      key={r.id}
                      className={
                        "border-t border-slate-100 " +
                        (idx % 2 === 0 ? "bg-white" : "bg-slate-50/60") +
                        " hover:bg-indigo-50/60 transition-colors"
                      }
                    >
                      <td className="px-3.5 py-2.5 font-mono text-[10px] text-slate-800">
                        {r.id}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800">
                        {r.typeLabel || r.type}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800">
                        {fmt(r.from)}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800">
                        {fmt(r.to)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-slate-800">
                        {r.type === "PR" ? "-" : r.days}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] capitalize " +
                            (r.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : r.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-amber-50 text-amber-700 border-amber-100 border")
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {r.reason}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <button
                          type="button"
                          disabled={isApproved}
                          onClick={() => revertLeave(r.id)}
                          className={[
                            "inline-flex items-center px-2.5 py-1.5 text-[10px] rounded-md border transition",
                            isApproved
                              ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                              : "border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300",
                          ].join(" ")}
                        >
                          Revert
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPLY MODAL */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-full max-w-2xl rounded-lg bg-white shadow-xl border border-slate-200"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 md:px-5 py-3 flex items-center justify-between border-b border-slate-100">
                <div className="text-sm font-semibold text-slate-800">
                  Apply Leave
                </div>
              </div>
              <LeaveForm
  leaveTypes={types}
  leaveTypesStatus={typesStatus}
  submitting={applyStatus === "loading"}
  error={applyError || typesError}
  onSubmit={handleSubmitForm}
  onCancel={() => setOpen(false)}
  onNeedTypes={ensureTypesLoaded}
/>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
