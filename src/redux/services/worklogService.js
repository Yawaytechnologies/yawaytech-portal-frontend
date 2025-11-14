// src/redux/services/worklogService.js
import axios from "axios";

// ---- Read Vite env correctly + sanitize base URL ----
const RAW = import.meta.env.VITE_API_BASE_URL;
if (!RAW) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Create .env.local with VITE_API_BASE_URL=<backend base URL>"
  );
}
const BASE_URL = String(RAW).replace(/\/+$/, "");

/** Axios base */
const api = axios.create({
  baseURL: BASE_URL, // e.g. https://yawaytech-portal-backend-python-2.onrender.com
  headers: { Accept: "application/json" },
});

// Attach token if present
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("auth.token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const toErr = (e) => {
  const msg =
    e?.response?.data?.detail ||
    e?.response?.data?.message ||
    e?.message ||
    "Request failed";
  return {
    message: msg,
    status: e?.response?.status || 0,
    data: e?.response?.data,
    path: e?.config?.url,
  };
};

/* ---------- Normalize backend date strings ---------- */
/* Convert "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss" */
const normDT = (v) => (typeof v === "string" ? v.replace(" ", "T") : v);

const normalizeRow = (r) =>
  r
    ? {
        ...r,
        start_time: normDT(r.start_time),
        end_time: normDT(r.end_time),
        // keep work_date as "YYYY-MM-DD"
      }
    : r;

const normalize = (data) =>
  Array.isArray(data) ? data.map(normalizeRow) : normalizeRow(data);

/** Enums */
export const WorkType = Object.freeze({
  FEATURE: "Feature",
  BUG_FIX: "Bug Fix",
  MEETING: "Meeting",
  TRAINING: "Training",
  SUPPORT: "Support",
  OTHER: "Other",
});

export const WorklogStatus = Object.freeze({
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
});

/**
 * Endpoints:
 *  POST  /api/worklog/                         (create worklog)
 *  GET   /api/employee/{employee_id}           (list worklogs for employee, with skip/limit)
 *  POST  /api/worklog/{id}/checkin
 *  POST  /api/worklog/{id}/checkout
 *  PATCH /api/worklog/{id}
 */
const WorklogService = {
  async create(payload) {
    try {
      const { data } = await api.post(`/api/worklog/`, payload);
      return normalize(data);
    } catch (e) {
      throw toErr(e);
    }
  },

  /**
   * List worklogs for one employee.
   * Maps to backend: GET /api/employee/{employee_id}?skip=&limit=
   */
  async listByEmployee(employeeId, opts = {}) {
    const { skip = 0, limit = 100 } = opts;
    try {
      const { data } = await api.get(
        `/api/employee/${encodeURIComponent(employeeId)}`,
        { params: { skip, limit } }
      );
      return normalize(data);
    } catch (e) {
      throw toErr(e);
    }
  },

  async checkIn(worklogId, whenISO) {
    try {
      const body = whenISO ? { at: whenISO } : undefined;
      const { data } = await api.post(
        `/api/worklog/${encodeURIComponent(worklogId)}/checkin`,
        body
      );
      return normalize(data);
    } catch (e) {
      throw toErr(e);
    }
  },

  async checkOut(worklogId, whenISO) {
    try {
      const body = whenISO ? { at: whenISO } : undefined;
      const { data } = await api.post(
        `/api/worklog/${encodeURIComponent(worklogId)}/checkout`,
        body
      );
      return normalize(data);
    } catch (e) {
      throw toErr(e);
    }
  },

  async patch(worklogId, patch) {
    try {
      const { data } = await api.patch(
        `/api/worklog/${encodeURIComponent(worklogId)}`,
        patch
      );
      return normalize(data);
    } catch (e) {
      throw toErr(e);
    }
  },
};

export default WorklogService;
