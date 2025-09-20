// /src/redux/services/employeeSideAttendanceService.js
import axios from "axios";
import dayjs from "dayjs";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "https://yawaytech-portal-backend-python-fyik.onrender.com").replace(/\/+$/,""),
});

// Strip Authorization for attendance endpoints; keep Accept/Content-Type sane
api.interceptors.request.use((config) => {
  const url = config.url || "";
  const isAttendance =
    url.includes("/api/attendance/check-in") ||
    url.includes("/api/attendance/check-out") ||
    url.endsWith("/api/attendance") ||
    url.endsWith("/attendance");

  if (!isAttendance) {
    const token = localStorage.getItem("auth.token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } else {
    if (config.headers?.Authorization) delete config.headers.Authorization;
  }

  config.headers = {
    Accept: "application/json",
    ...config.headers,
  };
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
    url: r?.config?.baseURL + r?.config?.url,
    params: r?.config?.params,
    headers: r?.config?.headers,
  });
};

// Detect “already checked in” across common messages
const isAlreadyCheckedIn = (err) => {
  const txt = JSON.stringify(err?.response?.data || "").toLowerCase();
  return /already\s*checked\s*in|active\s*session|session\s*exists|duplicate\s*check-?in/.test(txt);
};

const employeeSideAttendanceService = {
  async fetchMonth() { return {}; }, // no list endpoint yet

  async checkIn({ employeeId } = {}) {
    const empId = getEmployeeId(employeeId);
    if (!empId) throw new Error("Missing employeeId");

    // Try EXACT curl behavior first: POST with NO body (Content-Length: 0)
    try {
      const res = await api.post(
        "/api/attendance/check-in",
        undefined, // <-- no body
        { params: { employeeId: empId } }
      );
      const { checkInUtc, workDateLocal } = res.data || {};
      const key = todayKeyFromLocal(workDateLocal);
      return { key, record: { in: checkInUtc ?? new Date().toISOString(), out: null, totalMs: 0 } };
    } catch (e1) {
      // Retry with empty JSON body for backends that require it
      try {
        const res = await api.post(
          "/api/attendance/check-in",
          {}, // empty JSON
          { params: { employeeId: empId }, headers: { "Content-Type": "application/json" } }
        );
        const { checkInUtc, workDateLocal } = res.data || {};
        const key = todayKeyFromLocal(workDateLocal);
        return { key, record: { in: checkInUtc ?? new Date().toISOString(), out: null, totalMs: 0 } };
      } catch (e2) {
        logAxiosError("checkIn", e2);
        // If server says you’re already checked in, flip UI to “Check Out”
        if (e2?.response?.status === 400 && isAlreadyCheckedIn(e2)) {
          const key = todayKeyFromLocal();
          // we don’t know the exact check-in time; use now so UI toggles
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

    const res = await api.post(
      "/api/attendance/check-out",
      {}, // empty JSON (works for you already)
      { params: { employeeId: empId }, headers: { "Content-Type": "application/json" } }
    );

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
