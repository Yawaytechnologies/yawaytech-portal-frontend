import axios from "axios";

const RAW = import.meta.env.VITE_API_BASE_URL;
if (!RAW) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Create .env.local with VITE_API_BASE_URL=<backend base URL>",
  );
}
const BASE_URL = String(RAW).replace(/\/+$/, "");

const api = axios.create({
  baseURL: BASE_URL,
  headers: { Accept: "application/json" },
});

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

const normDT = (v) => (typeof v === "string" ? v.replace(" ", "T") : v);

const normalizeRow = (r) =>
  r
    ? {
        ...r,
        start_time: normDT(r.start_time),
        end_time: normDT(r.end_time),
      }
    : r;

const normalize = (data) =>
  Array.isArray(data) ? data.map(normalizeRow) : normalizeRow(data);

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
 * Endpoints (as per Swagger screenshots):
 *  POST  /api/worklog/
 *  GET   /api/employee/{employee_id}?skip=&limit=
 *  POST  /api/{worklog_id}/checkin
 *  POST  /api/{worklog_id}/checkout
 *  PATCH /api/worklog/{id}   (keep if your backend supports it)
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

  async listByEmployee(employeeId, opts = {}) {
    const { skip = 0, limit = 100 } = opts;
    try {
      const { data } = await api.get(
        `/api/employee/${encodeURIComponent(employeeId)}`,
        {
          params: { skip, limit },
        },
      );
      return normalize(data);
    } catch (e) {
      throw toErr(e);
    }
  },

  // ✅ FIXED PATHS (match Swagger): /api/{id}/checkin
  async checkIn(worklogId) {
    try {
      const { data } = await api.post(
        `/api/${encodeURIComponent(worklogId)}/checkin`,
      );
      return normalize(data);
    } catch (e) {
      throw toErr(e);
    }
  },

  // ✅ FIXED PATHS (match Swagger): /api/{id}/checkout
  async checkOut(worklogId) {
    try {
      const { data } = await api.post(
        `/api/${encodeURIComponent(worklogId)}/checkout`,
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
        patch,
      );
      return normalize(data);
    } catch (e) {
      throw toErr(e);
    }
  },
};

export default WorklogService;
