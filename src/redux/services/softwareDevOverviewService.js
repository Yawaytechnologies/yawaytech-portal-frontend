// src/redux/services/softwareDevOverviewService.js
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://yawaytech-portal-backend-python-2.onrender.com"
).replace(/\/+$/, "/");

const singleCandidates = (enc) => [
  `${API_BASE}api/dashboard/employees/${enc}`,
  `${API_BASE}api/employees/${enc}`,
  `${API_BASE}api/developers/${enc}`,
  `${API_BASE}api/employees/by-code/${enc}`,
  `${API_BASE}api/developers/by-employee-id/${enc}`,
];

function toDataUrlIfBase64(str) {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();
  // Heuristic: long string without spaces — treat as base64 payload
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 100) {
    // assume jpeg unless backend includes mime info
    return `data:image/jpeg;base64,${trimmed}`;
  }
  // if already a data URL
  if (trimmed.startsWith("data:")) return trimmed;
  return null;
}

function normalizeProfile(e) {
  // priority: explicit base64 field -> profile_picture
  if (e.profile_picture) {
    const dataUrl = toDataUrlIfBase64(e.profile_picture);
    if (dataUrl) return dataUrl;
  }

  // next: profile / photo_url / avatar
  const p = e.profile ?? e.photo_url ?? e.avatar ?? null;
  if (!p) return null;

  if (typeof p !== "string") return null;
  const s = p.trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;
  if (s.startsWith("/")) {
    // prepend base host (without double slash)
    return `${API_BASE.replace(/\/$/, "")}${s}`;
  }
  // else relative-ish, return as-is (browser may resolve relative to current origin)
  return s;
}

export function normalizeDeveloper(e = {}, fallbackId = "") {
  const employeeId = e.employee_id ?? e.employeeId ?? e.code ?? fallbackId ?? "";
  return {
    id: e.id ?? null,
    employeeId,
    name: e.name ?? e.employee_name ?? "—",
    jobTitle: e.job_title ?? e.designation ?? e.role ?? "Software Engineer",
    profile: normalizeProfile(e),
    email: e.email ?? "—",
    phone: e.mobile ?? e.phone ?? e.mobile_number ?? "—",
    doj: e.date_of_joining ?? e.doj ?? e.joiningDate ?? "—",
    dol: e.date_of_leaving ?? e.dol ?? "—",
    dob: e.date_of_birth ?? e.dob ?? "—",
    maritalStatus: e.marital_status ?? e.maritalStatus ?? "—",
    guardianName: e.father_name ?? e.guardian_name ?? e.parentName ?? "—",
    guardianPhone: e.guardianPhone ?? e.guardian_mobile ?? "—",
    pan: e.pan ?? e.panNumber ?? "—",
    aadhar: e.aadhar ?? e.aadharNumber ?? "—",
    address: e.permanent_address ?? e.address ?? "—",
    overview: e.overview ?? e.bio ?? e.description ?? "—",
    department: e.department ?? "—",
    raw: e,
  };
}

/**
 * Fetch developer by ID with fallback to list search.
 * @param {string} employeeId
 * @returns normalized developer object
 */
export async function fetchSoftwareDeveloperByIdAPI(employeeId) {
  const id = String(employeeId ?? "").trim();
  if (!id) throw new Error("Invalid employee id");

  const enc = encodeURIComponent(id);

  // 1) Try candidate single endpoints
  for (const url of singleCandidates(enc)) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) {
        // continue on 404 or other non-ok
        continue;
      }
      const payload = await res.json();
      return normalizeDeveloper(payload, id);
    } catch (err) {
      // network error -> try next
      continue;
    }
  }

  // 2) Fallback: fetch the employees list (attempt heavier search)
  try {
    const listUrl = `${API_BASE}api/dashboard/employees?department=IT&limit=1000&offset=0`;
    const res = await fetch(listUrl, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`List fetch failed: ${res.status}`);
    const payload = await res.json();

    // normalize list container shapes
    let list = [];
    if (Array.isArray(payload)) list = payload;
    else if (Array.isArray(payload.items)) list = payload.items;
    else if (Array.isArray(payload.results)) list = payload.results;
    else if (Array.isArray(payload.data)) list = payload.data;
    else list = [];

    const idLower = id.toLowerCase();
    const found = list.find((rec) => {
      const cand = (rec.employee_id ?? rec.employeeId ?? rec.id ?? rec.code ?? "").toString().trim().toLowerCase();
      return cand === idLower;
    }) || list.find((rec) => (rec.email ?? "").toString().toLowerCase() === idLower);

    if (found) return normalizeDeveloper(found, id);

    // not found -> return minimal normalized object (prevents UI crash)
    return normalizeDeveloper({ employee_id: id, name: id }, id);
  } catch (err) {
    throw new Error(`Could not fetch developer: ${err?.message ?? err}`);
  }
}
