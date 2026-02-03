// src/pages/LeavePortal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { selectEmployeeId } from "../redux/reducer/authSlice";
import LeaveForm from "../components/EmployeeLeave/LeaveForm";
import { resetApplyState } from "../redux/reducer/leaveSlice";

import { fetchPortalMonthData } from "../redux/actions/portalActions";
import {
  fetchLeaveTypes,
  applyLeave,
  fetchLeaveRequests,
} from "../redux/actions/leaveActions";

import { selectPortal } from "../redux/reducer/portalSlice";

dayjs.extend(isoWeek);

const fmt = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "—");
const formatDays = (n) => `${n} day${n === 1 ? "" : "s"}`;

const upper = (v) => String(v || "").toUpperCase();

function holidayDate(h) {
  return (
    h?.date ||
    h?.holiday_date ||
    h?.day ||
    h?.on ||
    (h?.raw ? h.raw.date || h.raw.holiday_date : null)
  );
}
function holidayKind(h) {
  const k = upper(
    h?.kind || h?.type || h?.category || (h?.is_govt ? "GOVT" : "COMPANY"),
  );
  return k.includes("GOV") ? "govt" : "company";
}
function leaveType(l) {
  return upper(l?.type || l?.leave_type || l?.code || l?.leave_type_code);
}
function leaveFrom(l) {
  return (
    l?.from ||
    l?.start ||
    l?.start_date ||
    l?.date_from ||
    l?.date ||
    l?.permission_date ||
    l?.start_datetime
  );
}
function leaveTo(l) {
  return (
    l?.to ||
    l?.end ||
    l?.end_date ||
    l?.date_to ||
    l?.date ||
    l?.permission_date ||
    l?.end_datetime
  );
}

export default function LeavePortal() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ✅ HOOKS MUST BE INSIDE THIS FUNCTION
  const employeeId = useSelector(selectEmployeeId);

  // ✅ portal slice -> calendar month data
  const portal = useSelector(selectPortal);

  // ✅ leave slice -> status table data
  // (supports either reducer key: employeeLeave OR leave)
  const leaveState = useSelector((s) => s.employeeLeave || s.leave || {});

  const {
    types = [],
    typesStatus = "idle",
    typesError = null,

    applyStatus = "idle",
    applyError = null,

    // ✅ take these from leave slice
    requests = [],
    requestsStatus = "idle",
    requestsError = null,
  } = leaveState;

  const {
    // ✅ take these from portal slice
    monthLeaves = [],
    monthHolidays = [],
    monthOverview = {
      totalLeaveDays: 0,
      approvedLeaveDays: 0,
      companyHolidays: 0,
      govtHolidays: 0,
      typeDays: { EL: 0, CL: 0, SL: 0 },
      permissionCount: 0,
    },
    monthStatus = "idle",
    monthError = null,
  } = portal;

  const [view, setView] = useState("calendar");
  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [open, setOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);

  /* ----------------------------- calendar grid ----------------------------- */
  const gridDays = useMemo(() => {
    const start = month.startOf("month");
    const end = month.endOf("month");
    const startGrid = start.startOf("week");
    const endGrid = end.endOf("week");
    const days = [];
    let cur = startGrid;
    while (cur.isBefore(endGrid) || cur.isSame(endGrid, "day")) {
      days.push(cur);
      cur = cur.add(1, "day");
    }
    return days;
  }, [month]);

  // ✅ Load month data only for calendar view
  useEffect(() => {
    if (!employeeId) return;
    if (view !== "calendar") return;

    dispatch(
      fetchPortalMonthData({
        employeeId,
        monthISO: month.toISOString(),
        region: "TN",
      }),
    )
      .unwrap()
      .catch((e) =>
        toast.error(e || monthError || "Failed to load month data"),
      );
  }, [dispatch, employeeId, month, view]);

  // Build holiday map
  const holidayMap = useMemo(() => {
    const map = new Map();
    (monthHolidays || []).forEach((h) => {
      const d = holidayDate(h);
      if (!d) return;
      const key = dayjs(d).format("YYYY-MM-DD");
      map.set(key, holidayKind(h));
    });
    return map;
  }, [monthHolidays]);

  // Build leave maps for calendar
  const { leaveDates, leavesByDate } = useMemo(() => {
    const dates = new Set();
    const byDate = new Map();

    (monthLeaves || []).forEach((l) => {
      const from = leaveFrom(l);
      const to = leaveTo(l) || from;

      const fromD = dayjs(from);
      const toD = dayjs(to);

      if (!fromD.isValid()) return;

      let d = fromD.startOf("day");
      const last = (toD.isValid() ? toD : fromD).startOf("day");

      while (d.isBefore(last) || d.isSame(last, "day")) {
        const key = d.format("YYYY-MM-DD");
        dates.add(key);
        const arr = byDate.get(key) || [];
        arr.push(l);
        byDate.set(key, arr);
        d = d.add(1, "day");
      }
    });

    return { leaveDates: dates, leavesByDate: byDate };
  }, [monthLeaves]);

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
    dispatch(resetApplyState()); // ✅ ADD THIS (clears old error)
    setOpen(true);

    if (typesStatus === "idle" || typesStatus === "failed") {
      dispatch(fetchLeaveTypes())
        .unwrap()
        .catch((e) => toast.error(e || "Failed to load leave types"));
    }
  };

  const handleOpenStatus = () => {
    setView("table");
    dispatch(fetchLeaveRequests({ employeeId }))
      .unwrap()
      .catch((e) =>
        toast.error(e || requestsError || "Failed to load requests"),
      );
  };

  const handleSubmitForm = (rec) => {
    if (!employeeId)
      return toast.error("Employee ID missing. Cannot apply leave.");

    dispatch(applyLeave({ employeeId, rec }))
      .unwrap()
      .then(() => {
        toast.success("Leave request submitted.");
        setOpen(false);

        dispatch(
          fetchPortalMonthData({
            employeeId,
            monthISO: month.toISOString(),
            region: "TN",
          }),
        );
      })
      .catch((e) =>
        toast.error(
          e || applyError || "Failed to apply leave. Please try again.",
        ),
      );
  };

  const revertLeave = () => toast.info("Revert needs backend cancel API.");

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

        <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-start md:justify-end">
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
              onClick={handleOpenStatus}
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

          <Motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenApply}
            className="inline-flex items-center justify-center px-3 md:px-3.5 py-1.5 text-[11px] md:text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Apply
          </Motion.button>

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

            <div className="flex-1 px-3 md:px-3.5 pt-1 pb-2 flex flex-col">
              <div className="grid grid-cols-7 text-[10px] text-slate-500 pb-0.5">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center">
                    {d}
                  </div>
                ))}
              </div>

              {(monthStatus === "loading" || monthError) && (
                <div className="text-[11px] text-slate-500 py-1">
                  {monthStatus === "loading"
                    ? "Loading month data..."
                    : monthError}
                </div>
              )}

              <div className="flex-1">
                <div className="grid grid-cols-7 gap-[1px] h-full">
                  {gridDays.map((d) => {
                    const key = d.format("YYYY-MM-DD");
                    const inMonth = d.isSame(month, "month");

                    let indicator = null;

                    const dayLeaves = leavesByDate.get(key) || [];
                    const hasLeave = leaveDates.has(key);

                    if (hasLeave) {
                      const hasPermission = dayLeaves.some(
                        (l) => leaveType(l) === "PR",
                      );
                      indicator = hasPermission ? "perm" : "taken";
                    } else if (holidayMap.has(key)) {
                      indicator = holidayMap.get(key);
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
                      ...new Set(dayLeaves.map((l) => leaveType(l))),
                    ].filter(Boolean);

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
                        <div className="absolute top-1 left-1 text-[9px] font-medium">
                          {d.date()}
                        </div>

                        {indicator && (
                          <span
                            className={`absolute bottom-1 left-1 h-1.5 w-1.5 rounded-full ${dotClass}`}
                          />
                        )}

                        {typeCodes.length > 0 && (
                          <div className="absolute bottom-1 right-1 flex flex-wrap gap-[2px] justify-end">
                            {typeCodes.slice(0, 3).map((code) => (
                              <span
                                key={code}
                                className={`px-1 rounded-full text-[8px] font-semibold text-white ${typeBadgeClass(
                                  code,
                                )}`}
                              >
                                {code === "PR" ? "Perm" : code}
                              </span>
                            ))}
                          </div>
                        )}

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
                  <div className="text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      <span className="text-slate-600">
                        Total leave (EL/CL/SL)
                      </span>
                    </div>
                    <div className="mt-0.5 ml-3 text-xs font-medium text-slate-900">
                      {formatDays(monthOverview.totalLeaveDays || 0)}
                    </div>
                  </div>

                  <div className="text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">Approved leave</span>
                    </div>
                    <div className="mt-0.5 ml-3 text-xs font-medium text-slate-900">
                      {formatDays(monthOverview.approvedLeaveDays || 0)}
                    </div>
                  </div>

                  <div className="text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-slate-600">Company holidays</span>
                    </div>
                    <div className="mt-0.5 ml-3 text-xs font-medium text-slate-900">
                      {formatDays(monthOverview.companyHolidays || 0)}
                    </div>
                  </div>

                  <div className="text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      <span className="text-slate-600">Govt holidays</span>
                    </div>
                    <div className="mt-0.5 ml-3 text-xs font-medium text-slate-900">
                      {formatDays(monthOverview.govtHolidays || 0)}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

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
                            {formatDays(monthOverview.typeDays?.[code] || 0)}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-1.5 text-[11px]">
                      <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                      <div className="text-slate-600">
                        <div>Permission</div>
                        <div className="mt-0.5 text-xs font-medium text-slate-900">
                          {monthOverview.permissionCount || 0} req(s)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 flex justify-start">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 text-[11px] font-medium rounded-md border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() =>
                    navigate("/leave-report", {
                      state: {
                        month: month.toISOString(),
                        leaves: monthLeaves,
                        holidays: monthHolidays,
                        overview: monthOverview,
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

      {/* TABLE VIEW (Status) */}
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
                {requestsStatus === "loading" && (
                  <tr>
                    <td
                      className="px-3.5 py-3 text-slate-500 text-center"
                      colSpan={8}
                    >
                      Loading...
                    </td>
                  </tr>
                )}

                {requestsStatus !== "loading" && requests.length === 0 && (
                  <tr>
                    <td
                      className="px-3.5 py-3 text-slate-500 text-center"
                      colSpan={8}
                    >
                      No requests yet.
                    </td>
                  </tr>
                )}

                {requests.map((r, idx) => {
                  const isApproved =
                    String(r.status).toLowerCase() === "approved";
                  return (
                    <tr
                      key={r.id ?? idx}
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
                            (String(r.status).toLowerCase() === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : String(r.status).toLowerCase() === "rejected"
                                ? "bg-rose-50 text-rose-700 border border-rose-100"
                                : "bg-amber-50 text-amber-700 border-amber-100 border")
                          }
                        >
                          {String(r.status).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {r.reason}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <button
                          type="button"
                          disabled={isApproved}
                          onClick={revertLeave}
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
          <Motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setOpen(false);
              dispatch(resetApplyState()); // ✅ ADD
            }}
          >
            <Motion.div
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
                onCancel={() => {
                  setOpen(false);
                  dispatch(resetApplyState()); // ✅ ADD
                }}
                onNeedTypes={() => {
                  if (typesStatus === "idle" || typesStatus === "failed") {
                    dispatch(fetchLeaveTypes())
                      .unwrap()
                      .catch((e) =>
                        toast.error(e || "Failed to load leave types"),
                      );
                  }
                }}
                onClearError={() => dispatch(resetApplyState())} // ✅ ADD THIS LINE
              />
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
