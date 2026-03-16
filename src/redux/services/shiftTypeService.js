import axios from "axios";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://yawaytech-portal-backend-python-2.onrender.com"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

const authConfig = (token, extra = {}) => ({
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  ...extra,
});

const publicConfig = (extra = {}) => ({
  headers: {
    "Content-Type": "application/json",
  },
  ...extra,
});

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.employees)) return data.employees;
  return [];
};

const normalizeEmployees = (data) =>
  toArray(data).map((emp) => ({
    employee_id:
      emp?.employee_id ||
      emp?.employeeId ||
      emp?.emp_id ||
      emp?.code ||
      emp?.id ||
      "",
    name:
      emp?.name || emp?.full_name || emp?.employee_name || emp?.username || "",
  }));

const getErrorMessage = (err, fallback) => {
  if (err?.code === "ECONNABORTED") {
    return "Unable to load shifts";
  }

  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    (typeof err?.response?.data === "string" ? err.response.data : "") ||
    err?.message ||
    fallback
  );
};

export const shiftTypeService = {
  async getAllShifts() {
    try {
      console.log("Calling shifts API:", `${BASE_URL}/shifts/allshits`);
      const res = await api.get("/shifts/allshits", publicConfig());
      return toArray(res.data);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to load shift types"));
    }
  },

  async createShift(payload, token) {
    try {
      const res = await api.post("/shifts/", payload, authConfig(token));
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to create shift"));
    }
  },

  async assignShift(payload, token) {
    try {
      const res = await api.post("/shifts/assign", payload, authConfig(token));
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to assign shift"));
    }
  },

  async getEmployeesByDepartment(department, token) {
    const dep = encodeURIComponent(department);

    try {
      const res = await api.get(`/api/department/${dep}`, authConfig(token));
      return normalizeEmployees(res.data);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to load employees"));
    }
  },
};
