// src/redux/services/employeeProfileService.js
const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const EMPLOYEES_PATH = "/api/employees"; // per your Swagger

/** Map backend -> UI shape required by EmployeeProfile.jsx */
export const adaptEmployee = (raw = {}) => {
  const leaving = raw.date_of_leaving ? new Date(raw.date_of_leaving) : null;
  return {
    id: raw.id ?? null,
    name: raw.name ?? "",
    employeeId: raw.employee_id ?? "",
    email: raw.email ?? "",
    mobile: raw.mobile_number ?? "",
    designation: raw.designation ?? "",
    department: raw.department ?? "",
    joinDate: raw.date_of_joining ?? "",
    dob: raw.date_of_birth ?? "",
    address: raw.permanent_address ?? "",
    officeAddress: "",
    fatherName: raw.father_name ?? "",
    fatherNumber: "",
    bloodGroup: raw.blood_group ?? "",
    status: leaving ? "Inactive" : "Active",
    avatarUrl: raw.avatar_url ?? "",
  };
};

const isIntLike = (v) => /^\d+$/.test(String(v || "").trim());

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`GET ${url} failed: ${res.status} ${msg}`);
  }
  return res.json();
}

/**
 * Fetch by either numeric DB id (/{id_}) OR by employee_id code (e.g., YPT123).
 * - If identifier is numeric -> /api/employees/{id_}
 * - Else -> try ?employee_id=... ; if not supported, fetch list and filter client-side
 */
export async function fetchEmployeeByIdAPI(identifier) {
  if (!identifier) throw new Error("Missing employee identifier");
  const id = String(identifier).trim();

  // 1) numeric id path
  if (isIntLike(id)) {
    const url = `${BASE}${EMPLOYEES_PATH}/${encodeURIComponent(id)}`;
    const data = await getJson(url);
    const raw = data?.data ?? data;
    return adaptEmployee(raw);
  }

  // 2) try query filter (?employee_id=XYZ)
  try {
    const url = `${BASE}${EMPLOYEES_PATH}?employee_id=${encodeURIComponent(id)}`;
    const data = await getJson(url);
    const list = Array.isArray(data) ? data
      : Array.isArray(data?.data) ? data.data
      : Array.isArray(data?.items) ? data.items
      : [];
    const found = list.find((e) => (e.employee_id || e.employeeId) === id);
    if (found) return adaptEmployee(found);
  } catch {
    /* ignore and fall back */
  }

  // 3) last resort: fetch all and filter on client
  const allUrl = `${BASE}${EMPLOYEES_PATH}`;
  const all = await getJson(allUrl);
  const list = Array.isArray(all) ? all
    : Array.isArray(all?.data) ? all.data
    : Array.isArray(all?.items) ? all.items
    : [];
  const match = list.find((e) => (e.employee_id || e.employeeId) === id);
  if (!match) {
    throw new Error(`Employee not found for "${id}". Backend may only accept numeric /{id_}.`);
  }
  return adaptEmployee(match);
}
