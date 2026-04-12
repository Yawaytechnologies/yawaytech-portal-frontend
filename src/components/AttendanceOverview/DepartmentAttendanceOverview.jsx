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
import {
  fetchEmployeeMonthReportForMonth,
  fetchPublishedWorkweekPolicy,
  fetchHolidayList,
  fetchApprovedLeaveRequests,
} from "../../redux/services/departmentAttendanceOverviewService";
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

  if (parts.length === 3) {
    return `${pad2(parts[0])}:${pad2(parts[1])}:${pad2(parts[2])}`;
  }

  if (parts.length === 2) {
    return `${pad2(parts[0])}:${pad2(parts[1])}:00`;
  }

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
    violet: "bg-violet-50 text-violet-800 border-violet-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    orange: "bg-orange-50 text-orange-800 border-orange-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
  };

  const toneCls = tones[tone] ?? "bg-slate-50 text-slate-800 border-slate-100";

  return (
    <div
      className={`
        rounded-xl border ${toneCls}
        px-3 py-3 sm:px-4 sm:py-4
        flex items-center gap-3
        min-h-[88px] sm:min-h-[96px]
        shadow-sm
      `}
    >
      <div
        className="
          grid place-items-center
          w-10 h-10 sm:w-11 sm:h-11
          rounded-xl bg-white shadow-sm flex-shrink-0
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-[12px] sm:text-[13px] leading-tight opacity-80 truncate">
          {title}
        </div>
        <div className="text-[14px] sm:text-[21px] lg:text-[23px] font-bold leading-tight mt-2 break-all">
          {value}
        </div>
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

    return dt.toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
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
  const s = String(val || "")
    .trim()
    .toLowerCase();

  if (!s) return "";
  if (s === "developer" || s === "dev") return "it";
  if (["hr", "it", "marketing", "finance", "sales"].includes(s)) return s;
  if (["HR", "IT", "MARKETING", "FINANCE", "SALES"].includes(String(val))) {
    return String(val).toLowerCase();
  }

  return "";
};

const labelOf = (val) =>
  DEPARTMENTS.find((d) => d.value === (val || "").toLowerCase())?.label ??
  (val ? String(val).toUpperCase() : "");

const getSaturdayOccurrence = (date) => {
  const dayOfMonth = date.getDate();
  return Math.floor((dayOfMonth - 1) / 7) + 1;
};

const isOffDayFromPolicy = (work_date_local, policy = {}) => {
  if (!work_date_local) return false;

  const d = new Date(work_date_local + "T00:00:00");
  const day = d.getDay();

  const keyMap = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
  };

  const key = keyMap[day];
  const rule = policy?.[key];

  if (rule === false) return true;
  if (rule === true) return false;

  if (key === "sat" && typeof rule === "string") {
    const occurrence = getSaturdayOccurrence(d);

    const allowed = rule
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .map((x) => {
        if (x.includes("1")) return 1;
        if (x.includes("2")) return 2;
        if (x.includes("3")) return 3;
        if (x.includes("4")) return 4;
        if (x.includes("5")) return 5;
        return NaN;
      })
      .filter(Number.isFinite);

    return allowed.includes(occurrence);
  }

  return false;
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
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

const getEmployeeIdFromRow = (row) =>
  (row?.employeeId || row?.employee_id || "").toString().trim().toUpperCase();

const normalizeLeaveType = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const PRESENT_OVERRIDE_LEAVE_TYPES = new Set([
  "permission",
  "half day",
  "half-day",
  "casual",
  "casual leave",
  "emergency",
  "emergency leave",
]);

const PAID_LEAVE_TYPES = new Set([
  "paid leave",
  "paidleave",
  "paid_leave",
  "earned leave",
  "privilege leave",
  "annual leave",
]);

const LOP_LEAVE_TYPES = new Set([
  "loss of pay",
  "lop",
  "loss_of_pay",
  "unpaid leave",
  "unpaid",
]);

const normalizeBackendStatus = (value) => {
  const s = String(value || "").trim().toLowerCase();

  if (!s) return "";

  if (s === "present") return "Present";
  if (s === "absent") return "Absent";
  if (s === "holiday") return "Holiday";
  if (s === "weekend") return "Week Off";
  if (s === "week off") return "Week Off";
  if (s === "leave") return "Leave";

  return "";
};

const normalizeStatus = (
  item,
  {
    workweekPolicy = {},
    holidaySet = new Set(),
    approvedLeaveMap = new Map(),
  } = {}
) => {
  const workDate = String(item?.work_date_local || "").trim();
  const empId = getEmployeeIdFromRow(item);
  const leaveKey = workDate && empId ? `${empId}__${workDate}` : "";
  const approvedLeaveType = leaveKey
    ? normalizeLeaveType(approvedLeaveMap.get(leaveKey))
    : "";

  const workedSeconds = Number(item?.seconds_worked) || 0;
  const workedHours = workedSeconds / 3600;

  const hasPunch =
    Boolean(item?.first_check_in_utc) || Boolean(item?.last_check_out_utc);

  const isHoliday = workDate && holidaySet.has(workDate);
  const isWeekOff = isOffDayFromPolicy(workDate, workweekPolicy);

  if (isHoliday) return "Holiday";

  if (isWeekOff && !hasPunch && workedSeconds <= 0) {
    return "Week Off";
  }

  if (approvedLeaveType && PRESENT_OVERRIDE_LEAVE_TYPES.has(approvedLeaveType)) {
    return "Present";
  }

  if (approvedLeaveType && PAID_LEAVE_TYPES.has(approvedLeaveType)) {
    return "Paid Leave";
  }

  if (approvedLeaveType && LOP_LEAVE_TYPES.has(approvedLeaveType)) {
    return "Loss Of Pay";
  }

  const backendStatus = normalizeBackendStatus(item?.status);
  if (backendStatus && backendStatus !== "Absent") {
    return backendStatus;
  }

  if (workedHours >= 8) return "Present";

  return "Absent";
};

const statusClass = (status) => {
  switch (status) {
    case "Present":
      return "bg-emerald-50 text-emerald-800 border border-emerald-100";
    case "Absent":
      return "bg-rose-50 text-rose-800 border border-rose-100";
    case "Holiday":
      return "bg-violet-50 text-violet-800 border border-violet-100";
    case "Week Off":
    case "Weekend":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "Paid Leave":
      return "bg-blue-50 text-blue-800 border border-blue-100";
    case "Loss Of Pay":
      return "bg-orange-50 text-orange-800 border border-orange-100";
    case "Leave":
      return "bg-amber-50 text-amber-800 border border-amber-100";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-200";
  }
};

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

  const employeeIdForPage = useMemo(() => {
    const routeId = String(decodedEmployeeIdParam || "")
      .trim()
      .toUpperCase();
    if (routeId) return routeId;

    const fromRow = featured ? getEmployeeIdFromRow(featured) : "";
    if (fromRow) return fromRow;

    const fromSelected = String(
      selectedEmployee?.employeeId || selectedEmployee?.employee_id || ""
    )
      .trim()
      .toUpperCase();

    return fromSelected || "";
  }, [decodedEmployeeIdParam, featured, selectedEmployee]);

  useEffect(() => {
    if (!employeeIdForPage) return;
    dispatch(fetchDepartmentEmployeeById({ employeeId: employeeIdForPage }));
  }, [dispatch, employeeIdForPage]);

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
  const [workweekPolicy, setWorkweekPolicy] = useState({});
  const [holidaySet, setHolidaySet] = useState(new Set());
  const [approvedLeaveMap, setApprovedLeaveMap] = useState(new Map());

  const monthLabel = useMemo(() => {
    if (!month) return "";
    const dt = new Date(`${month}-01T00:00:00`);
    if (Number.isNaN(dt.getTime())) return "";

    return dt.toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
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

  useEffect(() => {
    const initial =
      normalizeDeptSlug(deptParam) ||
      normalizeDeptSlug(department) ||
      DEPARTMENTS[0].value;

    if (initial && initial !== department) {
      dispatch(setDepartmentName(initial));
    }
  }, [deptParam, department, dispatch]);

  useEffect(() => {
    if (month) return;

    const dt = new Date();
    const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    dispatch(setDepartmentMonth(m));
  }, [dispatch, month]);

  useEffect(() => {
    if (!isEmployeeView && department && month) {
      dispatch(fetchDepartmentAttendanceByMonth(department, month));
    }
  }, [dispatch, department, month, isEmployeeView]);

  useEffect(() => {
    if (!month) return;

    let cancelled = false;

    Promise.allSettled([
      fetchPublishedWorkweekPolicy(),
      fetchHolidayList(month, "TN"),
      fetchApprovedLeaveRequests(),
    ])
      .then((results) => {
        if (cancelled) return;

        const [workweekRes, holidayRes, leaveRes] = results;

        if (workweekRes.status === "fulfilled") {
          setWorkweekPolicy(workweekRes.value?.policy_json || {});
        } else {
          setWorkweekPolicy({});
        }

        if (holidayRes.status === "fulfilled") {
          const holidayDates = new Set(
            (holidayRes.value || [])
              .map((h) => String(h?.holiday_date || "").trim())
              .filter(Boolean)
          );
          setHolidaySet(holidayDates);
        } else {
          setHolidaySet(new Set());
        }

        if (leaveRes.status === "fulfilled") {
          const leaveRows = leaveRes.value || [];
          const leaveMap = new Map();

          leaveRows.forEach((req) => {
            const empId = String(req?.employee_id || req?.employeeId || "")
              .trim()
              .toUpperCase();

            const from = String(req?.start_date || req?.from_date || "").trim();
            const to = String(req?.end_date || req?.to_date || from).trim();

            const leaveType = normalizeLeaveType(
              req?.leave_type ||
                req?.leaveType ||
                req?.leave_name ||
                req?.type ||
                req?.category ||
                ""
            );

            if (!empId || !from) return;

            const start = new Date(from + "T00:00:00");
            const end = new Date((to || from) + "T00:00:00");

            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
              return;
            }

            const cur = new Date(start);
            while (cur <= end) {
              const y = cur.getFullYear();
              const m = String(cur.getMonth() + 1).padStart(2, "0");
              const d = String(cur.getDate()).padStart(2, "0");
              const dateStr = `${y}-${m}-${d}`;
              leaveMap.set(`${empId}__${dateStr}`, leaveType);
              cur.setDate(cur.getDate() + 1);
            }
          });

          setApprovedLeaveMap(leaveMap);
        } else {
          setApprovedLeaveMap(new Map());
        }
      })
      .catch(() => {
        if (cancelled) return;
        setWorkweekPolicy({});
        setHolidaySet(new Set());
        setApprovedLeaveMap(new Map());
      });

    return () => {
      cancelled = true;
    };
  }, [month]);

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

        const items = (data?.items || []).map((x) => ({
          ...x,
          employeeId: employeeIdForPage,
          employee_id: employeeIdForPage,
        }));

        setHistory({
          loading: false,
          items,
        });

        if (data) {
          let holidayCount = 0;
          let weekOffCount = 0;
          let leaveCount = 0;

          items.forEach((row) => {
            const status = normalizeStatus(row, {
              workweekPolicy,
              holidaySet,
              approvedLeaveMap,
            });

            if (status === "Holiday") holidayCount += 1;
            else if (status === "Week Off") weekOffCount += 1;
            else if (status === "Leave") leaveCount += 1;
          });

          setEmployeeSummary({
            present: Number(data.present_days) || 0,
            absent: Number(data.absent_days) || 0,
            holiday: holidayCount,
            weekOff: weekOffCount,
            leave: leaveCount,
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
  }, [
    isEmployeeView,
    employeeIdForPage,
    month,
    workweekPolicy,
    holidaySet,
    approvedLeaveMap,
  ]);

  useEffect(
    () => () => {
      dispatch(clearDepartmentAttendance());
    },
    [dispatch]
  );

  const displayName = selectedEmployee?.name || featured?.name || "—";
  const displayEmpId = employeeIdForPage || "—";
  const displayDept =
    labelOf(selectedEmployee?.department || featured?.department || department) ||
    "—";

  const kpiSource = isEmployeeView
    ? employeeSummary || {
        present: 0,
        absent: 0,
        holiday: 0,
        weekOff: 0,
        leave: 0,
        hours: "00:00:00",
      }
    : {
        present: totals?.present ?? 0,
        absent: totals?.absent ?? 0,
        holiday: 0,
        weekOff: 0,
        leave: 0,
        hours: totals?.hours ?? "0h 0m",
      };

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[#FF5800] hover:text-[#e14e00] text-sm font-medium mb-3"
        >
          <span className="text-lg">←</span> Back
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white shadow p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            <h1 className="text-[24px] sm:text-[30px] lg:text-[32px] leading-tight font-extrabold text-slate-900">
              Employee Attendance
            </h1>

            <div className="flex items-center gap-2">
              <MonthBtn
                month={month}
                onChange={(m) => dispatch(setDepartmentMonth(m))}
              />
            </div>
          </div>

          <Card className="mt-4 px-3 py-3 sm:px-4 sm:py-4">
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

              <div className="text-center sm:text-left leading-tight min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
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

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <KPI
              tone="green"
              title="Present"
              value={kpiSource.present ?? 0}
              icon={<MdEventAvailable className="text-emerald-600 text-[20px]" />}
            />

            <KPI
              tone="red"
              title="Absent"
              value={kpiSource.absent ?? 0}
              icon={<MdEventBusy className="text-rose-600 text-[20px]" />}
            />

            <KPI
              tone="violet"
              title="Holiday"
              value={kpiSource.holiday ?? 0}
              icon={<MdCalendarToday className="text-violet-600 text-[20px]" />}
            />

            <KPI
              tone="slate"
              title="Week Off"
              value={kpiSource.weekOff ?? 0}
              icon={<MdCalendarToday className="text-slate-600 text-[20px]" />}
            />

            <KPI
              tone="amber"
              title="Leave"
              value={kpiSource.leave ?? 0}
              icon={<MdCalendarToday className="text-amber-600 text-[20px]" />}
            />

            <KPI
              tone="blue"
              title="Total Hours"
              value={kpiSource.hours ?? "—"}
              icon={<MdAccessTime className="text-sky-600 text-[20px]" />}
            />
          </div>

          <h2 className="mt-6 text-xl sm:text-2xl font-bold text-slate-900">
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
                <table className="w-full min-w-[680px]">
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
                        <Td colSpan={5} className="text-center py-10 text-slate-600">
                          {isEmployeeView
                            ? "No employee data."
                            : "No employee selected."}
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
                        const statusLabel = normalizeStatus(d, {
                          workweekPolicy,
                          holidaySet,
                          approvedLeaveMap,
                        });

                        return (
                          <tr
                            key={`${d.work_date_local}-${d.employee_id || d.employeeId || ""}`}
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