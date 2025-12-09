// /src/redux/services/employeeSideAttendanceService.js
import axios from "axios";
import dayjs from "dayjs";

const BASE = (import.meta.env.VITE_API_URL ||
  "https://yawaytech-portal-backend-python-2.onrender.com"
).replace(/\/+$/, "");

const api = axios.create({ baseURL: BASE });

/* ---------------- AUTH HANDLER ---------------- */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth.token");

  const isAttendance =
    config.url.includes("/api/check-in") ||
    config.url.includes("/api/check-out") ||
    config.url.includes("/api/attendance/active");

  if (!isAttendance && token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  config.headers.Accept = "application/json";
  return config;
});

/* ---------------- HELPERS ---------------- */
const safeJson = (v) => {
  try {
    return JSON.parse(v ?? "null");
  } catch {
    return null;
  }
};

const getEmployeeId = () => {
  const u =
    safeJson(localStorage.getItem("auth.user")) ||
    safeJson(localStorage.getItem("user"));

  return (
    u?.employeeId ||
    u?.employee_id ||
    u?.empId ||
    u?.emp_id ||
    u?.id ||
    null
  );
};

const todayKey = () => dayjs().format("YYYY-MM-DD");

/* ---------------- SERVICES ---------------- */
const employeeSideAttendanceService = {
  /* ------- CHECK IN ------- */
  async checkIn() {
    const empId = getEmployeeId();
    if (!empId) throw new Error("Missing employeeId");

    try {
      const res = await api.post("/api/check-in", null, {
        params: { employeeId: empId },
      });

      return {
        key: todayKey(),
        record: {
          in: res.data.checkInUtc,
          out: null,
          totalMs: 0,
        },
      };
    } catch (err) {
      const msg = (err?.response?.data?.detail || "").toLowerCase();

      if (msg.includes("already") || msg.includes("active")) {
        // FALLBACK
        const fallback = new Date().toISOString();

        localStorage.setItem("attendance.start", fallback);
        localStorage.setItem("attendance.running", "true");

        return {
          key: todayKey(),
          record: {
            in: fallback,
            out: null,
            totalMs: 0,
          },
          already: true,
        };
      }

      throw new Error(err?.response?.data?.detail || "Check-in failed");
    }
  },

  /* ------- CHECK OUT ------- */
  async checkOut({ existingInIso }) {
    const empId = getEmployeeId();
    if (!empId) throw new Error("Missing employeeId");

    try {
      const res = await api.post("/api/check-out", null, {
        params: { employeeId: empId },
      });

      const outIso = res.data.checkOutUtc;
      const worked = res.data.workedSeconds * 1000;

      return {
        key: todayKey(),
        record: {
          out: outIso,
          totalMs: worked,
        },
      };
    } catch (err) {
      throw new Error(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Check-out failed"
      );
    }
  },

  /* ------- ACTIVE SESSION (RESTORE TIMER) ------- */
  async fetchActiveSession() {
    const empId = getEmployeeId();
    if (!empId) return null;

    try {
      const res = await api.get("/api/attendance/active", {
        params: { employeeId: empId },
      });

      return res.data; // { checkInUtc, checkOutUtc?, workedSeconds }
    } catch {
      return null; // No session
    }
  },

  async fetchMonth() {
    return {};
  },
};

export default employeeSideAttendanceService;
export { employeeSideAttendanceService };
