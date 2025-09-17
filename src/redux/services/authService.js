// src/redux/services/authService.js

// If you have Vite, prefer putting this in .env as VITE_API_BASE
// Example: VITE_API_BASE=https://yawaytech-portal-backend-python-fyik.onrender.com
export const API_BASE =
  (import.meta?.env?.VITE_API_BASE || "https://yawaytech-portal-backend-python-fyik.onrender.com").replace(/\/+$/, "");

// ---- ID validation helpers ----
// Admin: allow 6 OR 9 chars (A–Z & 0–9) with at least one letter and one digit
const ADMIN_ID_REGEX = /^(?=.*[A-Z])(?=.*\d)(?:[A-Z0-9]{6}|[A-Z0-9]{9})$/;
// Employee: exactly 9 chars (unchanged; not used now)
const EMPLOYEE_ID_REGEX = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{9}$/;

const normalizeId = (v) => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
const isValidAdminId = (v) => ADMIN_ID_REGEX.test(v || "");

// ---- Small helpers ----
const json = (method, body, token) => ({
  method,
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

// ---- error parser ----
const parseError = async (res) => {
  try {
    const data = await res.json();
    if (data?.detail) {
      if (typeof data.detail === "string") return data.detail;
      if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
    }
  } catch {
    // If response body isn't JSON, fall back to status text
    return `${res.status} ${res.statusText}`;
  }
  return `${res.status} ${res.statusText}`;
};

// ================== ADMIN ==================

/**
 * Real Admin login:
 * 1) POST /api/admin/login  -> { access_token, token_type }
 * 2) GET  /api/admin/me     -> admin profile (optional fields)
 */
export const loginAdminService = async ({ adminId, password }) => {
  const normalized = normalizeId(adminId);
  if (!isValidAdminId(normalized)) {
    throw new Error("Admin ID must be 6 or 9 characters (A–Z, 0–9) and include letters & digits.");
  }

  // 1) Login
  const loginRes = await fetch(`${API_BASE}/api/admin/login`, json("POST", {
    // Backend expects: admin_id
    admin_id: normalized,
    password,
  }));

  if (!loginRes.ok) {
    throw new Error(await parseError(loginRes));
  }

  const loginData = await loginRes.json();
  const token = loginData?.access_token;
  if (!token) throw new Error("No access token received from server.");

  localStorage.setItem("token", token);

  // 2) Get profile
  const meRes = await fetch(`${API_BASE}/api/admin/me`, json("GET", null, token));
  if (!meRes.ok) {
    // Still allow login even if /me fails, but report a softer message
    const err = await parseError(meRes);
    console.warn("Fetching /api/admin/me failed:", err);
  }
  const profile = meRes.ok ? await meRes.json() : {};

  // Build a consistent user object
  const user = {
    role: "admin",
    adminId: normalized,
    ...profile, // server fields override if same keys exist
  };

  return { token, user };
};

// ================== (Optional placeholders for Employee; not used now) ==================
export const loginEmployeeService = async () => {
  throw new Error("Employee integration is not enabled yet.");
};

export const registerEmployeeService = async () => {
  throw new Error("Employee registration is not enabled yet.");
};

export const logoutUserService = () => {
  localStorage.removeItem("token");
};
