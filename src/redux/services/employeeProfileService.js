// ──────────────────────────────────────────────────────────────────────────────
// Employee Profile Service (single employee fetch + helpers)
// ──────────────────────────────────────────────────────────────────────────────
const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
// NOTE: keep trailing slash to avoid 307 SlashRedirect from the backend
const EMPLOYEES_PATH = "/api/employees/";
const DASHBOARD_PATH = "/api/dashboard/employees/";

const ALLOW_FIRST_ON_MISS =
  import.meta.env.VITE_ALLOW_FIRST_ON_MISS === "true";

const getToken = () => localStorage.getItem("token");
const isIntLike = (v) => /^\d+$/.test(String(v || "").trim());

// generic GET returning JSON (or raw text if not-json)
async function getJson(url) {
  const headers = { Accept: "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers, credentials: "include" });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status} ${text || res.statusText}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// normalize list-like payloads
const pickList = (data) =>
  Array.isArray(data) ? data
  : Array.isArray(data?.items) ? data.items
  : Array.isArray(data?.results) ? data.results
  : Array.isArray(data?.data) ? data.data
  : [];

// keep only the fields EmployeeProfile page needs
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
});

// attach meta to help the slice show “demo mode” if needed
const withMeta = (obj, source, usedDemo = false) =>
  Object.assign(pruneEmployee(obj), { __source: source, __usedDemo: usedDemo });

/**
 * Fetch one employee by numeric DB id OR by employee code.
 * Tries:
 *   1) /api/employees/:id (when identifier is numeric)
 *   2) /api/employees/?q=CODE (then client-filters)
 *   3) /api/dashboard/employees/?q=CODE (fallback)
 */
export async function fetchEmployeeByIdAPI(identifier) {
  const id = String(identifier ?? "").trim();
  if (!id) throw new Error("Missing employee identifier");

  // 1) numeric path (EMPLOYEES_PATH already ends with '/')
  if (isIntLike(id)) {
    const data = await getJson(`${BASE}${EMPLOYEES_PATH}${encodeURIComponent(id)}`);
    const raw = data?.data ?? data;
    return withMeta(raw || {}, "employees/:id");
  }

  // 2) search list by code using ?q=
  try {
    const url = `${BASE}${EMPLOYEES_PATH}?q=${encodeURIComponent(id)}&skip=0&limit=50`;
    const data = await getJson(url);
    const list = pickList(data);
    const match = list.find((e) => (e.employee_id || e.employeeId) === id);
    if (match) return withMeta(match, "employees?q");

    // some APIs also return a single object directly
    if ((data?.employee_id || data?.employeeId) === id) {
      return withMeta(data, "employees?q:single");
    }
    if (list.length && ALLOW_FIRST_ON_MISS) {
      return withMeta(list[0], "employees:first_item");
    }
  } catch {
    /* ignore and fall through */
  }

  // 3) dashboard fallback (also ?q=)
  try {
    const url = `${BASE}${DASHBOARD_PATH}?q=${encodeURIComponent(id)}&limit=10&offset=0`;
    const data = await getJson(url);
    const list = pickList(data);
    const match = list.find((e) => (e.employee_id || e.employeeId) === id);
    if (match) return withMeta(match, "dashboard?q");
    if (list.length && ALLOW_FIRST_ON_MISS) {
      return withMeta(list[0], "dashboard:first_item");
    }
  } catch {
    /* ignore */
  }

  throw new Error(
    `Employee not found for "${id}". Use numeric id or ensure the API supports filtering by employee_id.`
  );
}
