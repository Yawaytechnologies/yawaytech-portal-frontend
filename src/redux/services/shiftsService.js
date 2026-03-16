import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://yawaytech-portal-backend-python-2.onrender.com",
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

export const shiftsService = {
  // ✅ GET /shifts/employee/{employee_id}?target_date=YYYY-MM-DD
  async getCurrentShift(employeeId, targetDate) {
    try {
      const { data } = await api.get(
        `/shifts/employee/${encodeURIComponent(employeeId)}`,
        { params: targetDate ? { target_date: targetDate } : undefined },
      );
      return data;
    } catch (e) {
      // ✅ backend uses 404 when shift not assigned for that date
      if (e?.response?.status === 404) return null;
      throw toErr(e);
    }
  },

  // ✅ POST /shifts/assign
  // body: { employee_id: string, shift_id: number, effective_from: "YYYY-MM-DD", effective_to:"YYYY-MM-DD" }
  async assignShift(payload) {
    try {
      const { data } = await api.post(`/shifts/assign`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      return data;
    } catch (e) {
      throw toErr(e);
    }
  },
};
