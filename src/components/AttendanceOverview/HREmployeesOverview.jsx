// src/components/AttendanceOverview/HrEmployeeOverview.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdEventAvailable, MdEventBusy, MdAccessTime, MdCalendarToday } from "react-icons/md";

import { fetchEmployeeByIdAPI } from "../../redux/services/hrOverviewService";
import {
  fetchAttendanceByMonth,
  setAttendanceMonth,
  clearAttendance,
} from "../../redux/actions/hrAttendanceActions";

/* ------------------------------ helpers ---------------------------------- */
const fmtHM = (mins) => {
  if (!Number.isFinite(mins) || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

/* ------------------------------ component -------------------------------- */
export default function HrEmployeeOverview() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ⬇️ Pull employeeName/employeeCode from the attendance slice
  const { loading, error, month, rows, employeeName, employeeCode } = useSelector(
    (s) => s.attendance
  );

  // Employee card (profile API is best-effort only)
  const [emp, setEmp] = useState(null);
  const [loadingEmp, setLoadingEmp] = useState(true);

  // Default month once
  useEffect(() => {
    if (!month) {
      const dt = new Date();
      const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      dispatch(setAttendanceMonth(m));
    }
  }, [dispatch, month]);

  // Fetch when employee/month changes
  useEffect(() => {
    if (employeeId && month) {
      dispatch(fetchAttendanceByMonth(employeeId, month));
    }
  }, [dispatch, employeeId, month]);

  // Clear on unmount
  useEffect(() => {
    return () => dispatch(clearAttendance());
  }, [dispatch]);

  // Load employee card (non-blocking fallback if it fails)
  useEffect(() => {
    (async () => {
      try {
        const e = await fetchEmployeeByIdAPI(employeeId);
        setEmp(e);
      } catch {
        // fallback so page never shows "Employee not found"
        setEmp({ employeeId, name: employeeId, jobTitle: "", profile: null });
      } finally {
        setLoadingEmp(false);
      }
    })();
  }, [employeeId]);

  // Derive summary
  const { presentCount, absentCount, totalMinutes } = useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    let p = 0,
      a = 0,
      mins = 0;
    for (const r of list) {
      if (r?.label === "Present") {
        p += 1;
        mins += Number.isFinite(r?._mins) ? r._mins : 0;
      } else if (r?.label === "Absent") {
        a += 1;
      }
    }
    return { presentCount: p, absentCount: a, totalMinutes: mins };
  }, [rows]);

  // 👇 Display values (profile > month-report meta > fallback id)
  const displayName = emp?.name || emp?.employee_name || employeeName || employeeId;
  const displayCode = emp?.employeeId || emp?.employee_id || employeeCode || employeeId;

  return (
    <div className="min-h-screen bg-[#f4f6fa] caret-transparent">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <button onClick={() => navigate(-1)} className="text-[#FF5800] underline mb-3 sm:mb-4">
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0e1b34]">Employee Attendance</h2>
            <div className="flex items-center gap-2">
              {/* NEW: Year select (keeps month part) */}
              <HeaderYearButton
                month={month}
                onChange={(m) => dispatch(setAttendanceMonth(m))}
              />
              <HeaderMonthButton month={month} onChange={(m) => dispatch(setAttendanceMonth(m))} />
            </div>
          </div>

          {/* Profile (uses meta fallback; never blank) */}
          <div className="px-3 sm:px-6 pb-2">
            <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <img
                  src={(emp && (emp.profile || emp.profile_picture)) || "/placeholder-avatar.png"}
                  alt={displayName}
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-[#FF5800]"
                />
                <div className="min-w-0">
                  {/* ✅ NAME in bold */}
                  <div className="text-base sm:text-lg font-semibold text-[#0e1b34] truncate">
                    {displayName}
                  </div>
                  {/* ✅ ID below */}
                  <div className="text-xs text-gray-600">Employee ID - {displayCode}</div>
                  {!!(emp && emp.jobTitle) && (
                    <div className="text-xs text-gray-600">{emp.jobTitle}</div>
                  )}
                  {loadingEmp && <div className="text-[11px] text-gray-500">Loading profile…</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div
            className="px-3 sm:px-6 pb-4 grid gap-3 sm:gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
          >
            <SummaryCard
              icon={<MdEventAvailable />}
              label="Present"
              value={presentCount}
              bg="bg-green-50"
              text="text-green-700"
            />
            <SummaryCard
              icon={<MdEventBusy />}
              label="Absent"
              value={absentCount}
              bg="bg-rose-50"
              text="text-rose-700"
            />
            <SummaryCard
              icon={<MdAccessTime />}
              label="Total Hours"
              value={fmtHM(totalMinutes)}
              bg="bg-blue-50"
              text="text-blue-700"
            />
          </div>

          {/* History */}
          <div className="px-3 sm:px-6 pb-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#0e1b34] mb-2 sm:mb-3">
              Attendance History
            </h3>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm table-auto border-collapse">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <Th>Date</Th>
                      <Th>Check In</Th>
                      <Th>Check Out</Th>
                      <Th>Hours</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <Td colSpan={5} className="text-center py-6">
                          Loading…
                        </Td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <Td colSpan={5} className="text-center py-6 text-red-600">
                          {error}
                        </Td>
                      </tr>
                    ) : !rows || rows.length === 0 ? (
                      <tr>
                        <Td colSpan={5} className="text-center py-6">
                          No records
                        </Td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.date} className="border-t">
                          <Td className="whitespace-nowrap">{r.date}</Td>
                          <Td className="whitespace-nowrap">{r.timeIn || "—"}</Td>
                          <Td className="whitespace-nowrap">{r.timeOut || "—"}</Td>
                          <Td className="whitespace-nowrap">{r.hours}</Td>
                          <Td>
                            <span
                              className={`px-2 py-1 rounded text-[10px] sm:text-xs ${
                                r.label === "Present"
                                  ? "bg-green-100 text-green-700"
                                  : r.label === "Weekend"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {r.label}
                            </span>
                          </Td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* /History */}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ UI bits ---------------------------------- */
function HeaderMonthButton({ month, onChange }) {
  const label = React.useMemo(() => {
    if (!month) return "Month";
    const dt = new Date(`${month}-01T00:00:00`);
    return dt.toLocaleString(undefined, { month: "long" });
  }, [month]);

  return (
    <div className="relative inline-flex">
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 text-gray-700 bg-white">
        <MdCalendarToday className="text-lg" />
        <span className="hidden sm:inline text-sm">{label}</span>
      </div>
      <input
        type="month"
        value={month || ""}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer caret-transparent"
        onKeyDown={(e) => e.preventDefault()}
        onFocus={(e) => e.target.showPicker?.()}
        aria-label="Change month"
      />
    </div>
  );
}

/* NEW: Year selector (preserves current month) */
function HeaderYearButton({ month, onChange }) {
  const { selectedYear, monthPart } = React.useMemo(() => {
    const now = new Date();
    const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const val = month || fallback;
    const [y, m] = val.split("-");
    return { selectedYear: Number(y), monthPart: String(m).padStart(2, "0") };
  }, [month]);

  const years = React.useMemo(() => {
    const cy = new Date().getFullYear();
    const arr = [];
    for (let y = cy - 6; y <= cy + 4; y++) arr.push(y);
    return arr;
  }, []);

  const handleChange = (e) => {
    const newYear = e.target.value;
    onChange(`${newYear}-${monthPart}`);
  };

  return (
    <select
      value={selectedYear}
      onChange={handleChange}
      className="px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-700 text-sm"
      aria-label="Change year"
    >
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}

function SummaryCard({ icon, label, value, bg, text }) {
  return (
    <div className={`rounded-xl border border-gray-200 ${bg} p-3 sm:p-4 flex items-center gap-3`}>
      <div className={`${text} text-lg sm:text-xl`}>{icon}</div>
      <div>
        <div className="text-[11px] sm:text-xs text-gray-600">{label}</div>
        <div className="text-base sm:text-lg font-semibold text-[#0e1b34]">{value}</div>
      </div>
    </div>
  );
}
function Th({ children }) {
  return (
    <th className="px-3 sm:px-4 first:pl-0 py-2 sm:py-3 text-left font-medium">
      {children}
    </th>
  );
}
function Td({ children, colSpan, className = "" }) {
  return (
    <td
      className={`px-3 sm:px-4 first:pl-0 py-2 align-middle text-[#0e1b34] ${className}`}
      colSpan={colSpan}
    >
      {children || "—"}
    </td>
  );
}
