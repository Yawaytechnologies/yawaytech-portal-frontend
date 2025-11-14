// src/components/AttendanceOverview/DepartmentAttendanceOverview.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  MdCalendarToday,
  MdGroups,
  MdEventAvailable,
  MdEventBusy,
  MdAccessTime,
} from "react-icons/md";
import {
  fetchDepartmentAttendanceByMonth,
  setDepartmentMonth,
  setDepartmentName,
  clearDepartmentAttendance,
} from "../../redux/actions/departmentAttendanceOverviewAction";
import { fetchEmployeeMonthReportForMonth } from "../../redux/services/departmentAttendanceOverviewService";

/* ── tiny UI atoms ─────────────────────────────────────────────────────────── */
const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
);

const MiniStat = ({ title }) => (
  <Card className="p-5">
    <div className="text-[13px] text-slate-600">{title}</div>
    <div className="mt-3 text-xl font-semibold text-slate-900">—</div>
  </Card>
);

const KPI = ({ tone, icon, title, value }) => {
  const tones = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-100",
    red: "bg-rose-50 text-rose-800 border-rose-100",
    blue: "bg-sky-50 text-sky-800 border-sky-100",
  };
  const toneCls = tones[tone] ?? "bg-slate-50 text-slate-800 border-slate-100";
  return (
    <div className={`rounded-2xl border ${toneCls} p-5 flex items-center gap-4`}>
      <div className="grid place-items-center w-11 h-11 rounded-xl bg-white shadow-sm">{icon}</div>
      <div>
        <div className="text-[13px] opacity-80">{title}</div>
        <div className="text-2xl font-bold leading-snug">{value}</div>
      </div>
    </div>
  );
};

const Th = ({ children, className = "" }) => (
  <th className={`px-4 py-3 text-left font-semibold text-[13px] text-slate-600 ${className}`}>{children}</th>
);
const Td = ({ children, colSpan, className = "" }) => (
  <td className={`px-4 py-3 align-middle text-[13px] text-slate-800 ${className}`} colSpan={colSpan}>
    {children ?? "—"}
  </td>
);

/* ── header controls ───────────────────────────────────────────────────────── */
const MonthBtn = ({ month, onChange }) => {
  const label = useMemo(() => {
    if (!month) return "Month";
    const dt = new Date(`${month}-01T00:00:00`);
    return dt.toLocaleString(undefined, { month: "long" });
  }, [month]);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className="inline-flex items-center gap-2 h-[40px] px-3 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
      >
        <MdCalendarToday className="text-base" />
        <span className="text-sm">{label}</span>
      </button>
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
};

const YearSelect = ({ month, onChange }) => {
  const { selectedYear, monthPart } = useMemo(() => {
    const now = new Date();
    const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const val = month || fallback;
    const [y, m] = val.split("-");
    return { selectedYear: Number(y), monthPart: String(m).padStart(2, "0") };
  }, [month]);

  const years = useMemo(() => {
    const cy = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => cy - 6 + i);
  }, []);

  return (
    <select
      value={selectedYear}
      onChange={(e) => onChange(`${e.target.value}-${monthPart}`)}
      className="h-[40px] px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50"
      aria-label="Change year"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
};

/* ── helpers ──────────────────────────────────────────────────────────────── */
const DEPARTMENTS = [
  { value: "hr", label: "HR" },
  { value: "developer", label: "Developer" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finance" },
  { value: "sales", label: "Sales" },
];
const labelOf = (val) =>
  DEPARTMENTS.find((d) => d.value === (val || "").toLowerCase())?.label ?? (val ? String(val).toUpperCase() : "");

/** derive task-style status for UI: todo / in progress / done / weekend */
const deriveUiStatus = (item) => {
  const d = new Date(item.work_date_local + "T00:00:00");
  const day = d.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = day === 0 || day === 6;

  if (isWeekend && item.status === "Absent" && item.seconds_worked === 0) {
    return { label: "Weekend", tone: "weekend" };
  }

  if (item.status === "Absent") {
    return { label: "Todo", tone: "todo" };
  }

  if (item.status === "Present" && !item.last_check_out_utc) {
    return { label: "In Progress", tone: "progress" };
  }

  if (item.status === "Present" && item.last_check_out_utc) {
    return { label: "Done", tone: "done" };
  }

  return { label: item.status || "—", tone: "default" };
};

const statusToneClass = (tone) => {
  switch (tone) {
    case "todo":
      return "bg-amber-50 text-amber-800 border border-amber-100";
    case "progress":
      return "bg-sky-50 text-sky-800 border border-sky-100";
    case "done":
      return "bg-emerald-50 text-emerald-800 border border-emerald-100";
    case "weekend":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-100";
  }
};

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[d.getDay()];
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()} (${dayName})`;
};

const formatTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

/* ── component ───────────────────────────────────────────────────────────── */
export default function DepartmentAttendanceOverview() {
  const { department: deptParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, month, department, rows, totals } = useSelector(
    (s) => s.departmentAttendanceOverview
  );

  // pick a featured employee to show in header (first row)
  const featured = useMemo(() => (rows && rows.length > 0 ? rows[0] : null), [rows]);

  // per-day history for featured employee
  const [history, setHistory] = useState({ loading: false, items: [] });

  const monthLabel = useMemo(() => {
    if (!month) return "";
    const dt = new Date(`${month}-01T00:00:00`);
    return dt.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [month]);

  // init dept + month and fetch
  useEffect(() => {
    const initial = (deptParam || department || DEPARTMENTS[0].value).toLowerCase();
    if (initial !== department) dispatch(setDepartmentName(initial));
  }, [deptParam, department, dispatch]);

  useEffect(() => {
    if (!month) {
      const dt = new Date();
      const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      dispatch(setDepartmentMonth(m));
    }
  }, [dispatch, month]);

  useEffect(() => {
    if (department && month) dispatch(fetchDepartmentAttendanceByMonth(department, month));
  }, [dispatch, department, month]);

  // load per-day history for featured employee
  useEffect(() => {
    if (!featured?.employeeId || !month) {
      setHistory({ loading: false, items: [] });
      return;
    }

    let cancelled = false;
    setHistory((prev) => ({ ...prev, loading: true }));

    fetchEmployeeMonthReportForMonth(featured.employeeId, month)
      .then((data) => {
        if (cancelled) return;
        setHistory({
          loading: false,
          items: data?.items || [],
        });
      })
      .catch((err) => {
        console.error("Failed to load attendance history", err);
        if (cancelled) return;
        setHistory({ loading: false, items: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [featured?.employeeId, month]);

  useEffect(() => () => dispatch(clearDepartmentAttendance()), [dispatch]);

  return (
    <div className="min-h-screen bg-[#f4f6fa]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[#FF5800] hover:text-[#e14e00] text-sm font-medium mb-3"
        >
          <span className="text-lg">←</span> Back
        </button>

        {/* Main container */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow p-4 sm:p-6 lg:p-8">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            <h1 className="text-[28px] sm:text-[32px] leading-tight font-extrabold text-slate-900">
              Employee Attendance
            </h1>
            <div className="flex items-center gap-2">
              <YearSelect month={month} onChange={(m) => dispatch(setDepartmentMonth(m))} />
              <MonthBtn month={month} onChange={(m) => dispatch(setDepartmentMonth(m))} />
            </div>
          </div>

          {/* Profile strip: Name → Employee ID → Role/Department */}
          <Card className="mt-5 p-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-20 sm:h-20 rounded-full border-2 border-orange-400 bg-slate-100 overflow-hidden" />
              <div className="leading-tight">
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {featured?.name || "—"}
                </div>
                <div className="mt-1 text-[13px] sm:text-[14px] text-slate-600">
                  Employee ID - {featured?.employeeId || "—"}
                </div>
                <div className="text-[10px] sm:text-[14px] text-slate-600">
                  {labelOf(featured?.department || department) || "—"}
                </div>
              </div>
            </div>
          </Card>

          {/* Today mini stats */}
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <MiniStat title="Check-In (Today)" />
            <MiniStat title="Check-Out (Today)" />
            <MiniStat title="Total (Today)" />
          </div>

          {/* KPIs */}
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <KPI
              tone="green"
              title="Present"
              value={totals?.present ?? 0}
              icon={<MdEventAvailable className="text-emerald-600 text-xl" />}
            />
            <KPI
              tone="red"
              title="Absent"
              value={totals?.absent ?? 0}
              icon={<MdEventBusy className="text-rose-600 text-xl" />}
            />
            <KPI
              tone="blue"
              title="Total Hours"
              value={totals?.hours ?? "—"}
              icon={<MdAccessTime className="text-sky-600 text-xl" />}
            />
          </div>

          {/* Department summary table */}
          {/* <h2 className="mt-6 text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MdGroups className="text-slate-500" /> Department Summary
          </h2>

          <div className="mt-3">
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Employee ID</Th>
                      <Th>Department</Th>
                      <Th>Present</Th>
                      <Th>Absent</Th>
                      <Th>Total Hours</Th>
                      <Th className="w-40">Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <Td colSpan={6} className="text-center py-10 text-slate-500">
                          Loading…
                        </Td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <Td colSpan={6} className="text-center py-10 text-rose-600">
                          {error}
                        </Td>
                      </tr>
                    ) : !rows || rows.length === 0 ? (
                      <tr>
                        <Td colSpan={6} className="text-center py-10 text-slate-600">
                          No records for this month.
                        </Td>
                      </tr>
                    ) : (
                      rows.map((r) => {
                        const deptForRow = r.department || department;
                        return (
                          <tr key={r.employeeId} className="border-t hover:bg-slate-50/60 transition-colors">
                            <Td className="font-medium">{r.employeeId}</Td>
                            <Td>{labelOf(deptForRow)}</Td>
                            <Td>{r.presentDays}</Td>
                            <Td>{r.absentDays}</Td>
                            <Td>{r.hours}</Td>
                            <Td>
                              <Link
                                to={`/attendance/${department}/${encodeURIComponent(r.employeeId)}`}
                                className="inline-flex items-center text-[#FF5800] hover:text-[#e14e00] underline underline-offset-2"
                              >
                                View
                              </Link>
                            </Td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div> */}

          {/* Attendance History – per day for featured employee */}
          <h2 className="mt-6 text-2xl font-bold text-slate-900">Attendance History</h2>
          <div className="mt-1 text-[13px] text-slate-600">
            {featured?.name && monthLabel
              ? `${featured.name} • ${monthLabel}`
              : "Select a month to view detailed history."}
          </div>

          <div className="mt-3">
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Date</Th>
                      <Th>Check In</Th>
                      <Th>Check Out</Th>
                      <Th>Hours</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {!featured?.employeeId ? (
                      <tr>
                        <Td colSpan={5} className="text-center py-10 text-slate-600">
                          No employee selected.
                        </Td>
                      </tr>
                    ) : history.loading ? (
                      <tr>
                        <Td colSpan={5} className="text-center py-10 text-slate-500">
                          Loading attendance history…
                        </Td>
                      </tr>
                    ) : !history.items || history.items.length === 0 ? (
                      <tr>
                        <Td colSpan={5} className="text-center py-10 text-slate-600">
                          No records for this month.
                        </Td>
                      </tr>
                    ) : (
                      history.items.map((d) => {
                        const dateLabel = formatDateLabel(d.work_date_local);
                        const { label: statusLabel, tone } = deriveUiStatus(d);

                        return (
                          <tr key={d.work_date_local} className="border-t hover:bg-slate-50/60 transition-colors">
                            <Td>{dateLabel}</Td>
                            <Td>{formatTime(d.first_check_in_utc)}</Td>
                            <Td>{formatTime(d.last_check_out_utc)}</Td>
                            <Td>{d.hours_worked}</Td>
                            <Td>
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] ${statusToneClass(
                                  tone
                                )}`}
                              >
                                {statusLabel}
                              </span>
                            </Td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
