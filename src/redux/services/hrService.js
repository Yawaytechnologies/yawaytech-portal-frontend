// src/redux/services/hrService.js
const normalizeBase = (u) => (u?.endsWith("/") ? u : `${u}/`);

const normalizeEmployee = (e = {}) => {
  const employeeId = e.employee_id ?? e.employeeId ?? (e.id != null ? String(e.id) : "");
  return {
    id: e.id ?? null,
    employeeId,
    name: e.name ?? "—",
    role: e.designation ?? e.role ?? e.jobTitle ?? "—",
    email: e.email ?? "—",
    profile: e.profile || `https://i.pravatar.cc/150?u=${employeeId || e.id || e.email || "x"}`,
    department: e.department,
    _raw: e,
  };
};

export async function fetchHREmployeesAPI() {
  const base = normalizeBase(import.meta.env.VITE_API_BASE_URL);
  const url = `${base}api/dashboard/employees?department=HR&limit=20&offset=0`;     // include trailing slash
  const res = await fetch(url);
  const text = await res.text();            // read once for logging
  if (!res.ok) {
    console.error("EMP LIST ERROR", res.status, text);
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  let data;
  try { data = JSON.parse(text); } catch { data = []; }

  console.log("EMP LIST RAW:", data);

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.results)
    ? data.results
    : data
    ? [data]
    : [];

  const normalized = list.map(normalizeEmployee);
  console.log("EMP LIST NORMALIZED:", normalized);
  return normalized;
}
