// src/redux/services/authService.js
import { normalizeId, isAdminId, isEmployeeId } from "./idRules";

// Prefer env in dev to avoid cold starts (create .env.local: VITE_API_BASE=http://localhost:8000)
export const API_BASE =
  (import.meta?.env?.VITE_API_BASE || 
    import.meta?.env?.VITE_API_BASE_URL ||  
    "https://yawaytech-portal-backend-python-2.onrender.com").replace(/\/+$/, "");

// helpers
const json = (method, body, token) => ({
  method,
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

const parseError = async (res) => {
  try {
    const data = await res.json();
    if (data?.detail) {
      if (typeof data.detail === "string") return data.detail;
      if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
      if (typeof data.detail === "object") return JSON.stringify(data.detail);
    }
  } catch { /* ignore */ }
  return `${res.status} ${res.statusText}`;
};

const fetchWithTimeout = (url, opts = {}, ms = 3000) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(id));
};

// --- ADMIN login ---
export const loginAdminService = async ({ adminId, password }) => {
  const id = normalizeId(adminId);
  if (!isAdminId(id)) throw new Error("Please enter a valid Admin ID.");

  const loginRes = await fetch(`${API_BASE}/api/admin/login`, json("POST", { admin_id: id, password }));
  if (!loginRes.ok) throw new Error(await parseError(loginRes));
  const data = await loginRes.json();
  const token = data?.access_token;
  if (!token) throw new Error("No access token received from server.");
  localStorage.setItem("token", token);

  const result = { token, user: { role: "admin", adminId: id } };

  // fetch profile in background (do not block UI)
  fetchWithTimeout(`${API_BASE}api/admin/me`, json("GET", null, token), 3000)
    .then(async (r) => (r.ok ? r.json() : null))
    .then((profile) => {
      if (profile) localStorage.setItem("user", JSON.stringify({ ...result.user, ...profile }));
    })
    .catch(() => {});
   localStorage.setItem("user", JSON.stringify(result.user));
  return result;
};

// --- EMPLOYEE login ---
export const loginEmployeeService = async ({ employeeId, password }) => {
  const id = normalizeId(employeeId);
  if (!isEmployeeId(id)) console.warn("Non-standard employee id entered:", id);

  const loginRes = await fetch(`${API_BASE}/api/employee/login`, json("POST", { employee_id: id, password }));
  if (!loginRes.ok) throw new Error(await parseError(loginRes));
  const data = await loginRes.json();
  const token = data?.access_token;
  if (!token) throw new Error("No access token received from server.");
  localStorage.setItem("token", token);
 const user = { role: "employee", employeeId: id };
  localStorage.setItem("user", JSON.stringify(user));

  // (optional) warm up /me in background if you have it
  fetchWithTimeout(`${API_BASE}/api/employee/me`, json("GET", null, token))
    .then(async (r) => (r.ok ? r.json() : null))
    .then((profile) => {
      if (profile) localStorage.setItem("user", JSON.stringify({ ...user, ...profile }));
    })
    .catch(() => {});

  return { token, user };
};
export const registerEmployeeService = async () => {
  throw new Error("Employee registration is not enabled yet.");
};

export const logoutUserService = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
  