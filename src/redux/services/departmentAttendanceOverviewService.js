// src/redux/services/departmentAttendanceOverviewService.js
import dayjs from "dayjs";

/* --------------------------- base + helpers --------------------------- */
const rawBase =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  import.meta.env.VITE_API_URL ??
  "/";

const base = rawBase.endsWith("/") ? rawBase : rawBase + "/";

const join = (a, b) =>
  (a.endsWith("/") ? a : a + "/") + (b.startsWith("/") ? b.slice(1) : b);

const fmtHM = (seconds) => {
  const mins = Math.round((Number(seconds) || 0) / 60);
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

/* --------------------------- dept mapping ---------------------------- */
// Backend allows ONLY: HR, IT, SALES, FINANCE, MARKETING
const toBackendDepartment = (slug) => {
  const s = String(slug || "").trim();
  if (!s) return "";

  const key = s.toLowerCase();

  // aliases
  if (key === "developer" || key === "dev") return "IT";

  switch (key) {
    case "hr":
      return "HR";
    case "it":
      return "IT";
    case "sales":
      return "SALES";
    case "finance":
      return "FINANCE";
    case "marketing":
      return "MARKETING";
    default: {
      // if someone already passes "IT" / "HR" etc
      const up = s.toUpperCase();
      if (["HR", "IT", "SALES", "FINANCE", "MARKETING"].includes(up)) return up;
      return ""; // fail early instead of calling API with invalid dept
    }
  }
};

/* ------------------------- low-level API calls ------------------------ */

async function readErrorMessage(res) {
  // Prefer backend JSON { detail: "..." }
  try {
    const j = await res.json();
    if (j?.detail) return String(j.detail);
    return JSON.stringify(j);
  } catch {
    try {
      return await res.text();
    } catch {
      return res.statusText || "Request failed";
    }
  }
}

const getEmpId = (emp) =>
  String(emp?.employee_id ?? emp?.employeeId ?? emp?.emp_id ?? emp?.id ?? "")
    .trim()
    .toUpperCase();

async function fetchEmployeesByDepartment(departmentSlug) {
  const backendDept = toBackendDepartment(departmentSlug);

  if (!backendDept) {
    throw new Error(
      `Invalid department: "${departmentSlug}". Allowed: hr, it, sales, finance, marketing`
    );
  }

  const url = join(base, `api/department/${encodeURIComponent(backendDept)}`);
  const res = await fetch(url, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    const msg = await readErrorMessage(res);
    throw new Error(msg || `Failed to load employees (${res.status})`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  // Normalize shape a bit
  return data.map((e) => ({
    ...e,
    employee_id: getEmpId(e) || e.employee_id,
  }));
}

async function fetchEmployeeMonthReport(employeeId, year, month) {
  const id = String(employeeId || "").trim().toUpperCase();
  if (!id) return null;

  const path = `api/${encodeURIComponent(id)}/month-report`;
  const url =
    join(base, path) +
    `?year=${year}&month=${month}&include_absent=true&working_days_only=false&cap_to_today=false`;

  const res = await fetch(url, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    // keep silent for each employee (department aggregation)
    return null;
  }

  return res.json();
}

/* 🔹 Used by Attendance History (single employee view) */
export async function fetchEmployeeMonthReportForMonth(employeeId, monthValue) {
  const { year, month } = parseMonthStr(monthValue);
  return fetchEmployeeMonthReport(employeeId, year, month);
}

/* ---------------------- main aggregation function --------------------- */

export async function fetchDepartmentAttendanceOverviewAPI(
  departmentSlug,
  monthValue
) {
  const { year, month, normalized } = parseMonthStr(monthValue);
  const slug = String(departmentSlug || "").toLowerCase();

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

  // 2) For each employee, fetch month report
  const reports = await Promise.all(
    employees.map(async (emp) => {
      const empId = getEmpId(emp);
      const report = await fetchEmployeeMonthReport(empId, year, month);
      return { emp, empId, report };
    })
  );

  const rows = [];
  let totalSeconds = 0;
  let totalPresent = 0;
  let totalAbsent = 0;

  for (const item of reports) {
    if (!item?.report) continue;

    const { emp, empId, report } = item;

    const sec = Number(report.total_seconds_worked) || 0;
    const present = Number(report.present_days) || 0;
    const absent = Number(report.absent_days) || 0;

    totalSeconds += sec;
    totalPresent += present;
    totalAbsent += absent;

    rows.push({
      employeeId: empId,
      name: emp?.name ?? "—",
      department: emp?.department ?? "",
      role: emp?.designation ?? "",
      profilePicture: emp?.profile_picture ?? null,
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
