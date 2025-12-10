// src/redux/services/employeeProfileService.js
const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const EMPLOYEES_PATH = "/api/"; // ✅ route is /api/{employee_id}

const getToken = () => localStorage.getItem("token");

// GET → JSON helper
async function getJson(url) {
  const headers = { Accept: "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers, credentials: "include" });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text || res.statusText}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// keep fields + pass through image
const pruneEmployee = (raw = {}) => ({
  id: raw.id ?? null,
  name: raw.name ?? "",
  father_name: raw.father_name ?? "",
  date_of_birth: raw.date_of_birth ?? "",
  employee_id: raw.employee_id ?? "",
  date_of_joining: raw.date_of_joining ?? "",
  date_of_leaving: raw.date_of_leaving ?? "",
  email: raw.email ?? "",
  mobile_number: raw.mobile_number ?? "",
  marital_status: raw.marital_status ?? "",
  permanent_address: raw.permanent_address ?? "",
  designation: raw.designation ?? "",
  department: raw.department ?? "",
  pan_number: raw.pan_number ?? "",
  aadhar_number: raw.aadhar_number ?? "",
  profile_picture:
    raw.profile_picture ??
    raw.employee_picture ??
    raw.profile ??
    raw.photo ??
    raw.avatar ??
    "",
});

const withMeta = (obj, source) =>
  Object.assign(pruneEmployee(obj || {}), { __source: source });

/**
 * STRICT: always GET /api/employees/:id_or_code
 * Backend (per your Swagger) accepts codes like EMP000123 here.
 */
export async function fetchEmployeeByIdAPI(identifier) {
  const id = String(identifier ?? "").trim();
  if (!id) throw new Error("Missing employee identifier");

  // ✅ backend expects /api/{employee_id}
  const url = `${BASE}${EMPLOYEES_PATH}${encodeURIComponent(id)}`;
  const data = await getJson(url);
  const raw = data?.data ?? data; // tolerate wrappers
  if (!raw || typeof raw !== "object") throw new Error("Employee not found");
  return withMeta(raw, "employees/:id");
}

