import axios from "axios";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "") ||
  "https://yawaytech-portal-backend-python-2.onrender.com";

function getStoredToken() {
  const direct =
    localStorage.getItem("token") || sessionStorage.getItem("token") || "";

  if (direct) return direct;

 try {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user?.token) return user.token;
  if (user?.access_token) return user.access_token;
  if (user?.accessToken) return user.accessToken;
} catch {
  // ignore invalid user JSON in localStorage
}

try {
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  if (auth?.token) return auth.token;
  if (auth?.access_token) return auth.access_token;
  if (auth?.accessToken) return auth.accessToken;
} catch {
  // ignore invalid auth JSON in localStorage
}

  return "";
}

function getAuthHeaders(getState) {
  const reduxToken =
    getState?.()?.auth?.token ||
    getState?.()?.auth?.access_token ||
    getState?.()?.auth?.accessToken ||
    "";

  const token = reduxToken || getStoredToken();

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeListResponse(payload) {
  console.log("PAYROLL LIST RAW RESPONSE:", payload);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.payrolls)) return payload.payrolls;
  if (Array.isArray(payload?.employees)) return payload.employees;
  if (Array.isArray(payload?.calculations)) return payload.calculations;
  if (Array.isArray(payload?.rows)) return payload.rows;

  return [];
}

export async function fetchPayrollListService(monthStart, getState) {
  const response = await axios.get(`${API_BASE}/api/payroll/calculation/all`, {
    params: { month_start: monthStart },
    headers: getAuthHeaders(getState),
    timeout: 20000,
  });

  console.log("PAYROLL LIST AXIOS RESPONSE:", response.data);
  return normalizeListResponse(response.data);
}

export async function fetchEmployeePayrollDetailService(
  employeeId,
  monthStart,
  getState,
) {
  const response = await axios.get(
    `${API_BASE}/api/payroll/calculation/employee/${employeeId}`,
    {
      params: { month_start: monthStart },
      headers: getAuthHeaders(getState),
      timeout: 20000,
    },
  );

  console.log("EMPLOYEE PAYROLL DETAIL RESPONSE:", response.data);
  return response.data;
}
