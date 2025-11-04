// src/redux/services/salesService.js
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://yawaytech-portal-backend-python-2.onrender.com"
).replace(/\/+$/, "/");

function toDataUrlIfBase64(str) {
  if (!str || typeof str !== "string") return null;
  const s = str.trim();
  if (s.startsWith("data:")) return s;
  if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 100) {
    return `data:image/jpeg;base64,${s}`;
  }
  return null;
}

function normalizeProfile(e) {
  if (!e) return null;
  if (e.profile_picture) {
    const d = toDataUrlIfBase64(e.profile_picture);
    if (d) return d;
  }
  const p = e.profile ?? e.photo_url ?? e.avatar ?? e.profileUrl ?? null;
  if (!p || typeof p !== "string") return null;
  const s = p.trim();
  if (!s) return null;
  if (s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${API_BASE.replace(/\/$/, "")}${s}`;
  return s;
}

/** Normalize raw Sales employee object into UI-friendly shape */
export const normalizeSalesEmployee = (e = {}) => {
  const employeeId = e.employee_id ?? e.employeeId ?? (e.id != null ? String(e.id) : "");
  return {
    id: e.id ?? null,
    employeeId,
    name: e.name ?? e.employee_name ?? "—",
    designation: e.designation ?? e.role ?? e.jobTitle ?? "—",
    role: e.role ?? e.designation ?? "—",
    email: e.email ?? "—",
    mobile: e.mobile ?? e.mobile_number ?? e.phone ?? "—",
    department: e.department ?? "Sales",
    profile: normalizeProfile(e),
    dob: e.date_of_birth ?? e.dob ?? null,
    date_of_joining: e.date_of_joining ?? e.doj ?? null,
    date_of_leaving: e.date_of_leaving ?? e.dol ?? null,
    address: e.permanent_address ?? e.address ?? null,
    father_name: e.father_name ?? e.guardian_name ?? null,
    overview: e.overview ?? e.bio ?? null,
    raw: e,
  };
};

/* -------- fetch list -------- */
export async function fetchSalesEmployeesAPI({ limit = 100, offset = 0 } = {}) {
  const url = `${API_BASE}api/dashboard/employees?department=Sales&limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();

  if (!res.ok) throw new Error(`Sales API ${res.status}: ${text || res.statusText}`);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = [];
  }

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return list.map(normalizeSalesEmployee);
}

/* -------- fetch by id (tries single endpoints then list fallback) -------- */
const singleCandidates = (enc) => [
  `${API_BASE}api/dashboard/employees/${enc}`,
  `${API_BASE}api/employees/${enc}`,
  `${API_BASE}api/sales/${enc}`,
  `${API_BASE}api/employees/by-code/${enc}`,
  `${API_BASE}api/employees/by-employee-id/${enc}`,
];

export async function fetchSalesEmployeeByIdAPI(employeeId) {
  const id = String(employeeId || "").trim();
  if (!id) throw new Error("Invalid employee id");

  const enc = encodeURIComponent(id);

  // 1) single-item endpoints
  for (const url of singleCandidates(enc)) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const payload = await res.json();
      return normalizeSalesEmployee(payload, id);
    } catch {
      continue;
    }
  }

  // 2) list fallback
  const list = await fetchSalesEmployeesAPI({ limit: 1000, offset: 0 });
  const idLower = id.toLowerCase();
  const found =
    list.find((r) => (r.employeeId || "").toString().trim().toLowerCase() === idLower) ||
    list.find((r) => (r.email || "").toString().trim().toLowerCase() === idLower);

  if (found) return found;
  return normalizeSalesEmployee({ employee_id: id, name: id }, id);
}
