// src/components/AttendanceOverview/DepartmentAttendanceOverview.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  MdCalendarToday,
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
import { fetchDepartmentEmployeeById } from "../../redux/actions/departmentOverviewAction";
import { toast, Slide } from "react-toastify";

/* 🔔 Toast pill config */
const TOAST_BASE = {
  position: "top-center",
  transition: Slide,
  autoClose: 1800,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
};

const PILL = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  width: "auto",
  maxWidth: "min(72vw, 260px)",
  padding: "5px 9px",
  lineHeight: 1.2,
  minHeight: 0,
  borderRadius: "10px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
  fontSize: "0.80rem",
  fontWeight: 600,
};

const STYLE_ERROR = {
  ...PILL,
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
};

const pad2 = (n) => String(n).padStart(2, "0");

const toHHMMSSFromSeconds = (sec) => {
  const s = Math.max(0, Number(sec) || 0);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
};

const normalizeHHMMorHHMMSS = (v) => {
  if (!v) return "00:00:00";
  const parts = String(v)
    .trim()
    .split(":")
    .map((x) => Number(x));

  if (parts.some((n) => !Number.isFinite(n))) return "00:00:00";

  if (parts.length === 3)
    return `${pad2(parts[0])}:${pad2(parts[1])}:${pad2(parts[2])}`;
  if (parts.length === 2) return `${pad2(parts[0])}:${pad2(parts[1])}:00`;
  return "00:00:00";
};

const formatHoursWorked = (row) => {
  const sec = row?.seconds_worked ?? row?.total_seconds_worked;
  if (sec !== undefined && sec !== null && sec !== "") {
    return toHHMMSSFromSeconds(sec);
  }
  return normalizeHHMMorHHMMSS(row?.hours_worked ?? row?.total_hours_worked);
};

/* ── tiny UI atoms ─────────────────────────────────────────────────────────── */
const Card = ({ className = "", children }) => (
  <div
    className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
  >
    {children}
  </div>
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
      <div className="grid place-items-center w-11 h-11 rounded-xl bg-white shadow-sm">
        {icon}
      </div>
      <div>
        <div className="text-[13px] opacity-80">{title}</div>
        <div className="text-2xl font-bold leading-snug">{value}</div>
      </div>
    </div>
  );
};

const Th = ({ children, className = "" }) => (
  <th
    className={`px-4 py-3 text-left font-semibold text-[13px] text-slate-600 ${className}`}
  >
    {children}
  </th>
);
const Td = ({ children, colSpan, className = "" }) => (
  <td
    className={`px-4 py-3 align-middle text-[13px] text-slate-800 ${className}`}
    colSpan={colSpan}
  >
    {children ?? "—"}
  </td>
);

/* ── header control: month + year together ────────────────────────────────── */
const MonthBtn = ({ month, onChange }) => {
  const inputRef = useRef(null);

  const label = useMemo(() => {
    if (!month) return "Select month";
    const dt = new Date(`${month}-01T00:00:00`);
    if (Number.isNaN(dt.getTime())) return "Select month";
    return dt.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [month]);

  const minYear = 2019;
  const maxYear = 2029;
  const min = `${minYear}-01`;
  const max = `${maxYear}-12`;

  const handleButtonClick = () => {
    if (inputRef.current && inputRef.current.showPicker) {
      inputRef.current.showPicker();
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="inline-flex items-center">
      <button
        type="button"
        onClick={handleButtonClick}
        className="inline-flex items-center gap-2 h-[40px] px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50"
      >
        <MdCalendarToday className="text-base" />
        <span>{label}</span>
      </button>

      <input
        ref={inputRef}
        type="month"
        value={month || ""}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="sr-only"
        aria-label="Change month"
      />
    </div>
  );
};

/* ── helpers ──────────────────────────────────────────────────────────────── */
const DEPARTMENTS = [
  { value: "hr", label: "HR" },
  { value: "it", label: "IT" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finance" },
  { value: "sales", label: "Sales" },
];

const normalizeDeptSlug = (val) => {
  const s = String(val || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "developer" || s === "dev") return "it";
  if (["hr", "it", "marketing", "finance", "sales"].includes(s)) return s;
  // also accept backend uppercase strings
  if (["HR", "IT", "MARKETING", "FINANCE", "SALES"].includes(String(val))) {
    return String(val).toLowerCase();
  }
  return "";
};

const labelOf = (val) =>
  DEPARTMENTS.find((d) => d.value === (val || "").toLowerCase())?.label ??
  (val ? String(val).toUpperCase() : "");

const isWeekend = (work_date_local) => {
  if (!work_date_local) return false;
  const d = new Date(work_date_local + "T00:00:00");
  const day = d.getDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
};

const normalizeStatus = (item) => {
  const s = String(item?.status || "")
    .trim()
    .toLowerCase();

  if (s === "leave") return "Leave";
  if (s === "present") return "Present";

  const noWork =
    (Number(item?.seconds_worked) || 0) === 0 &&
    !item?.first_check_in_utc &&
    !item?.last_check_out_utc;

  if (isWeekend(item?.work_date_local) && noWork) return "Weekend";

  return "Absent";
};

const statusClass = (status) => {
  switch (status) {
    case "Present":
      return "bg-emerald-50 text-emerald-800 border border-emerald-100";
    case "Leave":
      return "bg-amber-50 text-amber-800 border border-amber-100";
    case "Weekend":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "Absent":
    default:
      return "bg-rose-50 text-rose-800 border border-rose-100";
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
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getEmployeeIdFromRow = (row) =>
  (row?.employeeId || row?.employee_id || "").toString().trim().toUpperCase();

/* ── component ───────────────────────────────────────────────────────────── */
export default function DepartmentAttendanceOverview() {
  const { department: deptParam, employeeId: employeeIdParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { month, department, rows, totals, error } = useSelector(
    (s) => s.departmentAttendanceOverview
  );

  const { selectedEmployee } = useSelector((s) => s.departmentOverview || {});

  const decodedEmployeeIdParam = useMemo(
    () => (employeeIdParam ? decodeURIComponent(employeeIdParam) : ""),
    [employeeIdParam]
  );

  const isEmployeeView = Boolean(decodedEmployeeIdParam);

  // pick featured employee from department rows
  const featured = useMemo(() => {
    if (!rows || rows.length === 0) return null;

    if (decodedEmployeeIdParam) {
      const match = rows.find(
        (r) => getEmployeeIdFromRow(r) === decodedEmployeeIdParam.toUpperCase()
      );
      if (match) return match;
    }

    return rows[0];
  }, [rows, decodedEmployeeIdParam]);

  // Use route employeeId first (do NOT depend on rows)
  const employeeIdForPage = useMemo(() => {
    const routeId = String(decodedEmployeeIdParam || "").trim().toUpperCase();
    if (routeId) return routeId;

    const fromRow = featured ? getEmployeeIdFromRow(featured) : "";
    if (fromRow) return fromRow;

    const fromSelected =
      String(selectedEmployee?.employeeId || selectedEmployee?.employee_id || "")
        .trim()
        .toUpperCase();
    return fromSelected || "";
  }, [decodedEmployeeIdParam, featured, selectedEmployee]);

  // fetch full employee detail (for profile card)
  useEffect(() => {
    if (!employeeIdForPage) return;
    dispatch(fetchDepartmentEmployeeById({ employeeId: employeeIdForPage }));
  }, [dispatch, employeeIdForPage]);

  // more robust avatar handling (URL / data URL / raw base64)
  const avatar = useMemo(() => {
    const e = selectedEmployee || {};
    const avatarRaw = e.profile || e.profile_picture || e.avatar || null;
    if (!avatarRaw) return null;

    const s = String(avatarRaw).trim();

    if (s.startsWith("data:")) return s;
    if (s.startsWith("http://") || s.startsWith("https://")) return s;

    return `data:image/jpeg;base64,${s}`;
  }, [selectedEmployee]);

  const [history, setHistory] = useState({ loading: false, items: [] });
  const [employeeSummary, setEmployeeSummary] = useState(null);

  const monthLabel = useMemo(() => {
    if (!month) return "";
    const dt = new Date(`${month}-01T00:00:00`);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [month]);

  useEffect(() => {
    if (!error) return;

    const msg =
      typeof error === "string"
        ? error
        : error?.message ||
          "Failed to load department attendance. Please try again.";

    toast(msg, {
      ...TOAST_BASE,
      style: STYLE_ERROR,
      icon: false,
    });
  }, [error]);

  // init dept from URL OR keep existing (normalize developer->it)
  useEffect(() => {
    const initial =
      normalizeDeptSlug(deptParam) ||
      normalizeDeptSlug(department) ||
      DEPARTMENTS[0].value;

    if (initial && initial !== department) {
      dispatch(setDepartmentName(initial));
    }
  }, [deptParam, department, dispatch]);

  // init month (current month) once
  useEffect(() => {
    if (month) return;
    const dt = new Date();
    const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    dispatch(setDepartmentMonth(m));
  }, [dispatch, month]);

  // fetch department attendance whenever dept/month changes
  useEffect(() => {
    if (department && month) {
      dispatch(fetchDepartmentAttendanceByMonth(department, month));
    }
  }, [dispatch, department, month]);

  // load per-day history + per-employee summary (employee view)
  useEffect(() => {
    if (!isEmployeeView) {
      setHistory({ loading: false, items: [] });
      setEmployeeSummary(null);
      return;
    }

    if (!employeeIdForPage || !month) {
      setHistory({ loading: false, items: [] });
      setEmployeeSummary(null);
      return;
    }

    let cancelled = false;
    setHistory((prev) => ({ ...prev, loading: true }));
    setEmployeeSummary(null);

    fetchEmployeeMonthReportForMonth(employeeIdForPage, month)
      .then((data) => {
        if (cancelled) return;

        setHistory({
          loading: false,
          items: data?.items || [],
        });

        if (data) {
          setEmployeeSummary({
            present: Number(data.present_days) || 0,
            absent: Number(data.absent_days) || 0,
            hours:
              data.total_seconds_worked !== undefined &&
              data.total_seconds_worked !== null
                ? toHHMMSSFromSeconds(data.total_seconds_worked)
                : normalizeHHMMorHHMMSS(data.total_hours_worked),
          });
        } else {
          setEmployeeSummary(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load attendance history", err);
        if (cancelled) return;
        setHistory({ loading: false, items: [] });
        setEmployeeSummary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isEmployeeView, employeeIdForPage, month]);

  // cleanup on unmount
  useEffect(
    () => () => {
      dispatch(clearDepartmentAttendance());
    },
    [dispatch]
  );

  const displayName = selectedEmployee?.name || featured?.name || "—";
  const displayEmpId = employeeIdForPage || "—";
  const displayDept =
    labelOf(
      selectedEmployee?.department || featured?.department || department
    ) || "—";

  const kpiSource = isEmployeeView
    ? employeeSummary || { present: 0, absent: 0, hours: "00:00:00" }
    : {
        present: totals?.present ?? 0,
        absent: totals?.absent ?? 0,
        hours: totals?.hours ?? "0h 0m",
      };

  return (
    <div className="min-h-screen bg-[#f4f6fa]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[#FF5800] hover:text-[#e14e00] text-sm font-medium mb-3"
        >
          <span className="text-lg">←</span> Back
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white shadow p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            <h1 className="text-[28px] sm:text-[32px] leading-tight font-extrabold text-slate-900">
              Employee Attendance
            </h1>
            <div className="flex items-center gap-2">
              <MonthBtn
                month={month}
                onChange={(m) => dispatch(setDepartmentMonth(m))}
              />
            </div>
          </div>

          <Card className="mt-5 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex justify-center sm:justify-start">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={displayName || "Employee avatar"}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-orange-400 object-cover bg-slate-100"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-orange-400 bg-slate-100 flex items-center justify-center text-[11px] text-slate-500">
                    No Image
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left leading-tight">
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {displayName}
                </div>
                <div className="mt-1 text-[13px] sm:text-[14px] text-slate-600">
                  Employee ID - {displayEmpId}
                </div>
                <div className="text-[12px] sm:text-[14px] text-slate-600">
                  {displayDept}
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <KPI
              tone="green"
              title="Present"
              value={kpiSource.present ?? 0}
              icon={<MdEventAvailable className="text-emerald-600 text-xl" />}
            />
            <KPI
              tone="red"
              title="Absent"
              value={kpiSource.absent ?? 0}
              icon={<MdEventBusy className="text-rose-600 text-xl" />}
            />
            <KPI
              tone="blue"
              title="Total Hours"
              value={kpiSource.hours ?? "—"}
              icon={<MdAccessTime className="text-sky-600 text-xl" />}
            />
          </div>

          <h2 className="mt-6 text-2xl font-bold text-slate-900">
            Attendance History
          </h2>
          <div className="mt-1 text-[13px] text-slate-600">
            {displayName && monthLabel
              ? `${displayName} • ${monthLabel}`
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
                    {!isEmployeeView || !employeeIdForPage ? (
                      <tr>
                        <Td
                          colSpan={5}
                          className="text-center py-10 text-slate-600"
                        >
                          {isEmployeeView ? "No employee data." : "No employee selected."}
                        </Td>
                      </tr>
                    ) : history.loading ? (
                      <tr>
                        <Td
                          colSpan={5}
                          className="text-center py-10 text-slate-500"
                        >
                          Loading attendance history…
                        </Td>
                      </tr>
                    ) : !history.items || history.items.length === 0 ? (
                      <tr>
                        <Td
                          colSpan={5}
                          className="text-center py-10 text-slate-600"
                        >
                          No records for this month.
                        </Td>
                      </tr>
                    ) : (
                      history.items.map((d) => {
                        const dateLabel = formatDateLabel(d.work_date_local);
                        const statusLabel = normalizeStatus(d);

                        return (
                          <tr
                            key={d.work_date_local}
                            className="border-t hover:bg-slate-50/60 transition-colors"
                          >
                            <Td>{dateLabel}</Td>
                            <Td>{formatTime(d.first_check_in_utc)}</Td>
                            <Td>{formatTime(d.last_check_out_utc)}</Td>
                            <Td>{formatHoursWorked(d)}</Td>
                            <Td>
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] ${statusClass(
                                  statusLabel
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
