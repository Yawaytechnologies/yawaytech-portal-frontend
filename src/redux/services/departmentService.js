// src/redux/services/departmentService.js
const RAW = import.meta.env?.VITE_API_BASE_URL ?? "";
const API_URL = RAW.replace(/\/+$/, ""); // strip trailing slash

if (!API_URL) {
  throw new Error("VITE_API_BASE_URL is not set.");
}

/** Route segment -> backend department name */
export const ROUTE_TO_API_DEPT = {
  hr: "HR",
  developer: "IT",          // route /employees/developer maps to IT in API
  marketing: "Marketing",
  finance: "Finance",
  sales: "Sales",
};

/** Fetch employees by department */
export async function fetchEmployeesByDepartment({
  routeDept,
  limit = 100,   // currently unused by backend; kept for future pagination
  offset = 0,    // currently unused by backend; kept for future pagination
  token,
}) {
  const apiDept = ROUTE_TO_API_DEPT[String(routeDept).toLowerCase()];
  if (!apiDept) throw new Error(`Unknown department: ${routeDept}`);

  // Backend path: /api/department/{department}
  const url = `${API_URL}/api/department/${encodeURIComponent(apiDept)}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse error, will be handled by res.ok
  }

  if (!res.ok) {
    const msg = Array.isArray(data?.detail)
      ? data.detail.map((d) => d.msg || d.detail || d).join(", ")
      : data?.detail || res.statusText || "Failed to fetch employees";
    throw new Error(msg);
  }

  // /api/department/{dept} returns a plain array of employees
  return data; // array or {items,total} depending on how you later change backend
}
