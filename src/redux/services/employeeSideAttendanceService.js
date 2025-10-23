// /src/redux/services/employeeSideAttendanceService.js
import axios from "axios";
import dayjs from "dayjs";

const BASE = (import.meta.env.VITE_API_URL || "https://yawaytech-portal-backend-python-2.onrender.com").replace(/\/+$/, "");
const PREFIX_LS_KEY = "attendance.prefix"; // "/api/attendance" or "/attendance"

const api = axios.create({ baseURL: BASE });

// Strip Authorization for attendance endpoints; keep Accept header sane
api.interceptors.request.use((config) => {
  const url = (config.url || "");
  const isAttendance =
    url.includes("/attendance/check-in") ||
    url.includes("/attendance/check-out");

  if (!isAttendance) {
    const token = localStorage.getItem("auth.token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  config.headers = { Accept: "application/json", ...config.headers };
  return config;
});

const safeJson = (s) => { try { return JSON.parse(s ?? "null"); } catch { return null; } };
const getEmployeeId = (passed) => {
  if (passed) return passed;
  const u = safeJson(localStorage.getItem("auth.user")) || safeJson(localStorage.getItem("user"));
  return u?.employeeId || u?.employee_id || u?.empId || u?.emp_id || u?.id || null;
};
const todayKeyFromLocal = (workDateLocal) =>
  (workDateLocal ? dayjs(workDateLocal) : dayjs()).format("YYYY-MM-DD");

const logAxiosError = (where, err) => {
  const r = err?.response;
  console.error(`[Attendance] ${where} failed`, {
    status: r?.status,
    data: r?.data,
    url: (r?.config?.baseURL || "") + (r?.config?.url || ""),
    params: r?.config?.params,
    headers: r?.config?.headers,
  });
};

// Probe which prefix the server actually uses and cache it
async function resolveAttendancePrefix() {
  const cached = localStorage.getItem(PREFIX_LS_KEY);
  if (cached) return cached;

  const candidates = ["/api/attendance", "/attendance"];
  for (const prefix of candidates) {
    try {
      // Lightweight probe: call a guaranteed 404-safe OPTIONS
      await api.options(`${prefix}/check-in`, { params: { employeeId: "probe" } });
      // If OPTIONS succeeds (204/200), we consider this a working prefix
      localStorage.setItem(PREFIX_LS_KEY, prefix);
      return prefix;
    } catch (e) {
      const code = e?.response?.status;
      // If we get 405 Method Not Allowed (common for OPTIONS), that's fine—prefix exists.
      if (code === 405) {
        localStorage.setItem(PREFIX_LS_KEY, prefix);
        return prefix;
      }
      // 404 means this prefix likely doesn't exist; try next
      if (code !== 404) {
        // For other errors, still try this prefix on actual POST; we'll detect 404 later.
        localStorage.setItem(PREFIX_LS_KEY, prefix);
        return prefix;
      }
    }
  }
  // Default to /api/attendance if all else fails
  localStorage.setItem(PREFIX_LS_KEY, "/api/attendance");
  return "/api/attendance";
}

// POST helper that retries with the alternate prefix on 404
async function postAttendance(pathSuffix, body, params) {
  let prefix = await resolveAttendancePrefix();

  try {
    return await api.post(`${prefix}${pathSuffix}`, body, {
      params,
      headers: body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch (e) {
    if (e?.response?.status === 404) {
      // flip prefix and retry once
      const alt = prefix === "/api/attendance" ? "/attendance" : "/api/attendance";
      const res = await api.post(`${alt}${pathSuffix}`, body, {
        params,
        headers: body ? { "Content-Type": "application/json" } : undefined,
      });
      // cache the working one
      localStorage.setItem(PREFIX_LS_KEY, alt);
      return res;
    }
    throw e;
  }
}

const isAlreadyCheckedIn = (err) => {
  const txt = JSON.stringify(err?.response?.data || "").toLowerCase();
  return /already\s*checked\s*in|active\s*session|session\s*exists|duplicate\s*check-?in/.test(txt);
};

const employeeSideAttendanceService = {
  async fetchMonth() {
    return {}; // (no list endpoint yet)
  },

  async checkIn({ employeeId } = {}) {
    const empId = getEmployeeId(employeeId);
    if (!empId) throw new Error("Missing employeeId");

    // Try with no body first (some servers expect empty body)
    try {
      const res = await postAttendance("/check-in", undefined, { employeeId: empId });
      const { checkInUtc, workDateLocal } = res.data || {};
      const key = todayKeyFromLocal(workDateLocal);
      return { key, record: { in: checkInUtc ?? new Date().toISOString(), out: null, totalMs: 0 } };
    } catch {
      // Retry with {} body if the server requires JSON
      try {
        const res = await postAttendance("/check-in", {}, { employeeId: empId });
        const { checkInUtc, workDateLocal } = res.data || {};
        const key = todayKeyFromLocal(workDateLocal);
        return { key, record: { in: checkInUtc ?? new Date().toISOString(), out: null, totalMs: 0 } };
      } catch (e2) {
        logAxiosError("checkIn", e2);
        if (e2?.response?.status === 400 && isAlreadyCheckedIn(e2)) {
          const key = todayKeyFromLocal();
          return { key, record: { in: new Date().toISOString(), out: null, totalMs: 0 }, already: true };
        }
        const msg = String(e2?.response?.data?.detail || e2?.response?.data?.message || e2.message || "Check-in failed");
        throw new Error(msg);
      }
    }
  },

  async checkOut({ employeeId, existingInIso } = {}) {
    const empId = getEmployeeId(employeeId);
    if (!empId) throw new Error("Missing employeeId");

    const res = await postAttendance("/check-out", {}, { employeeId: empId });
    const { checkOutUtc, totalMs, workDateLocal } = res.data || {};
    const outIso = checkOutUtc ?? new Date().toISOString();
    const key = todayKeyFromLocal(workDateLocal);
    const duration =
      typeof totalMs === "number"
        ? totalMs
        : existingInIso
        ? Math.max(0, new Date(outIso).getTime() - new Date(existingInIso).getTime())
        : 0;

    return { key, record: { out: outIso, totalMs: duration } };
  },
};

export default employeeSideAttendanceService;
export { employeeSideAttendanceService };
