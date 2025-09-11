// src/components/AttendanceOverview/SoftwareDeveloperAttendanceOverview.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdEventAvailable, MdEventBusy, MdAccessTime, MdCalendarToday } from "react-icons/md";

import { fetchAttendanceByMonthAPI } from "../../redux/services/devAttendanceService"; // re-exported here
import {
  fetchDevAttendanceByMonth,
  setDevAttendanceMonth,
  clearDevAttendance,
} from "../../redux/actions/devAttendanceActions";

/* ------------------------------ small UI bits -------------------------------- */
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
const Th = ({ children }) => (
  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-medium">{children}</th>
);
const Td = ({ children, colSpan, className = "" }) => (
  <td className={`px-3 sm:px-4 py-2 align-middle ${className}`} colSpan={colSpan}>
    {children || "—"}
  </td>
);

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

/* ------------------------------ component ----------------------------------- */
export default function SoftwareDeveloperAttendanceOverview() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, month, rows, present, absent, totalHours } =
    useSelector((s) => s.devAttendance);

  const [dev, setDev] = useState(null);
  const [loadingDev, setLoadingDev] = useState(true);

  // Default month once
  useEffect(() => {
    if (!month) {
      const dt = new Date();
      const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      dispatch(setDevAttendanceMonth(m));
    }
  }, [dispatch, month]);

  // Fetch when employee/month changes
  useEffect(() => {
    if (employeeId && month) {
      dispatch(fetchDevAttendanceByMonth(employeeId, month));
    }
  }, [dispatch, employeeId, month]);

  // Clear on unmount
  useEffect(() => () => dispatch(clearDevAttendance()), [dispatch]);

  // Load developer card (non-blocking fallback)
  useEffect(() => {
    (async () => {
      try {
        const d = await fetchAttendanceByMonthAPI(employeeId);
        setDev(d);
      } catch {
        // Fallback so page never blocks
        setDev({ employeeId, name: employeeId, jobTitle: "", profile: null });
      } finally {
        setLoadingDev(false);
      }
    })();
  }, [employeeId]);

  // Derive summary if reducer didn't already supply
  const derived = useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    let p = 0, a = 0, mins = 0;
    for (const r of list) {
      if (r?.label === "Present") { p += 1; mins += Number.isFinite(r?._mins) ? r._mins : 0; }
      else if (r?.label === "Absent") a += 1;
    }
    return { p, a, mins };
  }, [rows]);

  const presentCount = present ?? derived.p;
  const absentCount  = absent ?? derived.a;
  const totalHrs     = totalHours ?? `${Math.floor((derived.mins || 0) / 60)}h ${String((derived.mins || 0) % 60).padStart(2,"0")}m`;

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
            {/* NEW: year + month controls */}
            <div className="flex items-center gap-2">
              <HeaderYearButton month={month} onChange={(m) => dispatch(setDevAttendanceMonth(m))} />
              <HeaderMonthButton month={month} onChange={(m) => dispatch(setDevAttendanceMonth(m))} />
            </div>
          </div>

          {/* Developer card (uses fallback if API fails) */}
          <div className="px-3 sm:px-6 pb-2">
            <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <img
                  src={(dev && (dev.profile || dev.profile_picture)) || "/placeholder-avatar.png"}
                  alt={(dev && dev.name) || "Employee"}
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-[#FF5800]"
                />
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-semibold text-[#0e1b34] truncate">
                    {(dev && dev.name) || employeeId}
                  </div>
                  <div className="text-xs text-gray-600">
                    Employee ID - {(dev && (dev.employeeId || dev.employee_id)) || employeeId}
                  </div>
                  {!!(dev && dev.jobTitle) && (
                    <div className="text-xs text-gray-600">{dev.jobTitle}</div>
                  )}
                  {loadingDev && <div className="text-[11px] text-gray-500">Loading profile…</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div
            className="px-3 sm:px-6 pb-4 grid gap-3 sm:gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
          >
            <SummaryCard icon={<MdEventAvailable />} label="Present" value={presentCount}
              bg="bg-green-50" text="text-green-700" />
            <SummaryCard icon={<MdEventBusy />} label="Absent" value={absentCount}
              bg="bg-rose-50" text="text-rose-700" />
            <SummaryCard icon={<MdAccessTime />} label="Total Hours" value={totalHrs}
              bg="bg-blue-50" text="text-blue-700" />
          </div>

          {/* History */}
          <div className="px-3 sm:px-6 pb-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#0e1b34] mb-2 sm:mb-3">
              Attendance History
            </h3>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <Th>Date</Th>
                      <Th>Check In</Th>
                      <Th>Check Out</Th>
                      <Th>Hours</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody className="text-[#0e1b34]">
                    {loading ? (
                      <tr><Td colSpan={5} className="text-center py-6">Loading…</Td></tr>
                    ) : error ? (
                      <tr><Td colSpan={5} className="text-center py-6 text-red-600">{error}</Td></tr>
                    ) : !rows || rows.length === 0 ? (
                      <tr><Td colSpan={5} className="text-center py-6">No records</Td></tr>
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
