import axios from "axios";

const BASE = (
  import.meta.env.VITE_API_URL ||
  "https://yawaytech-portal-backend-python-2.onrender.com"
).replace(/\/+$/, "");

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("auth.token");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers.Accept = "application/json";
  return config;
});

const unwrap = (res) => res.data;

/** ---------------- LEAVE PORTAL APIs (Employee) ---------------- */
export const portalService = {
  // Leave Types (employee)
  getLeaveTypes: () => api.get("/api/leave/types").then(unwrap),

  // Leave Balances (employee)
  getLeaveBalances: ({ employeeId, year, month }) =>
    api
      .get("/api/leave/balances", { params: { employeeId, year, month } })
      .then(unwrap),

  // Monthly Summary (employee)
  getLeaveSummary: ({ employeeId, year, month }) =>
    api
      .get("/api/leave/summary", { params: { employeeId, year, month } })
      .then(unwrap),

  // Calendar data (employee)
  getLeaveCalendar: ({ employeeId, start, end }) =>
    api
      .get("/api/leave/calendar", { params: { employeeId, start, end } })
      .then(unwrap),

  // Requests list for Status tab (guess endpoint; if yours differs, change here ONLY)
  getLeaveRequests: ({ employeeId }) =>
    api.get("/api/leave/requests", { params: { employeeId } }).then(unwrap),

  /** ---------------- ADMIN APIs used in Employee Portal UI ---------------- */
  // Holidays list (admin)
  getAdminHolidays: ({ start, end, region = "TN" }) =>
    api
      .get("/api/admin/leave/holidays", { params: { start, end, region } })
      .then(unwrap),

  // Admin leave types (optional fallback)
  getAdminLeaveTypes: () => api.get("/api/admin/leave/types").then(unwrap),
};
