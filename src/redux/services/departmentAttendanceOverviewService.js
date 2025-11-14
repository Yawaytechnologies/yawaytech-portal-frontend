// src/redux/services/departmentAttendanceOverviewService.js
import dayjs from "dayjs";

/* --------------------------- base + helpers --------------------------- */
const rawBase =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  "/";

const base = rawBase.endsWith("/") ? rawBase : rawBase + "/";

const join = (a, b) =>
  (a.endsWith("/") ? a : a + "/") + (b.startsWith("/") ? b.slice(1) : b);

const fmtHM = (seconds) => {
  const mins = Math.round((seconds || 0) / 60);
  if (!Number.isFinite(mins) || mins <= 0) return "0h 0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

export const monthStr = (d = dayjs()) => dayjs(d).format("YYYY-MM");

const parseMonthStr = (value) => {
  const fallback = dayjs();
  if (!value) {
    return {
      year: fallback.year(),
      month: fallback.month() + 1,
      normalized: fallback.format("YYYY-MM"),
    };
  }
  const [y, m] = String(value).split("-");
  const year = Number(y) || fallback.year();
  const month = Number(m) || fallback.month() + 1;
  const normalized = `${year}-${String(month).padStart(2, "0")}`;
  return { year, month, normalized };
};

const toBackendDepartment = (slug) => {
  const key = (slug || "").toLowerCase();
  switch (key) {
    case "hr":
      return "HR";
    case "marketing":
      return "Marketing";
    case "finance":
      return "Finance";
    case "sales":
      return "Sales";
    case "developer":
      // Adjust if your DB uses "IT" or "Developer"
      return "IT";
    default:
      return slug || "";
  }
};

/* ------------------------- low-level API calls ------------------------ */

async function fetchEmployeesByDepartment(departmentSlug) {
  const backendDept = toBackendDepartment(departmentSlug);
  if (!backendDept) {
    throw new Error("Missing department");
  }

  const url = join(base, `api/department/${encodeURIComponent(backendDept)}`);
  const res = await fetch(url, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to load employees (${res.status}): ${text || res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data;
}

async function fetchEmployeeMonthReport(employeeId, year, month) {
  if (!employeeId) return null;

  const path = `api/${encodeURIComponent(employeeId)}/month-report`;
  const url =
    join(base, path) +
    `?year=${year}&month=${month}&include_absent=true&working_days_only=false&cap_to_today=false`;

  const res = await fetch(url, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    console.warn("month-report failed for", employeeId, res.status);
    return null;
  }

  return res.json();
}

/* 🔹 NEW: get full month report for one employee (used by Attendance History) */
export async function fetchEmployeeMonthReportForMonth(employeeId, monthValue) {
  const { year, month } = parseMonthStr(monthValue);
  return fetchEmployeeMonthReport(employeeId, year, month);
}

/* ---------------------- main aggregation function --------------------- */

export async function fetchDepartmentAttendanceOverviewAPI(departmentSlug, monthValue) {
  const { year, month, normalized } = parseMonthStr(monthValue);
  const slug = (departmentSlug || "").toLowerCase();

  // 1) Get all employees in this department
  const employees = await fetchEmployeesByDepartment(slug);

  if (!employees.length) {
    return {
      department: slug,
      month: normalized,
      rows: [],
      totals: { present: 0, absent: 0, seconds: 0, hours: "0h 0m" },
    };
  }

  // 2) For each employee, fetch their month report in parallel
  const reports = await Promise.all(
    employees.map(async (emp) => {
      const report = await fetchEmployeeMonthReport(emp.employee_id, year, month);
      return { emp, report };
    })
  );

  const rows = [];
  let totalSeconds = 0;
  let totalPresent = 0;
  let totalAbsent = 0;

  for (const item of reports) {
    if (!item || !item.report) continue;
    const { emp, report } = item;

    const sec = Number(report.total_seconds_worked) || 0;
    const present = Number(report.present_days) || 0;
    const absent = Number(report.absent_days) || 0;

    totalSeconds += sec;
    totalPresent += present;
    totalAbsent += absent;

    rows.push({
      employeeId: emp.employee_id,
      name: emp.name,
      department: emp.department,
      role: emp.designation,
      profilePicture: emp.profile_picture,
      presentDays: present,
      absentDays: absent,
      hours: fmtHM(sec),
    });
  }

  const totals = {
    present: totalPresent,
    absent: totalAbsent,
    seconds: totalSeconds,
    hours: fmtHM(totalSeconds),
  };

  return {
    department: slug,
    month: normalized,
    rows,
    totals,
  };
}
