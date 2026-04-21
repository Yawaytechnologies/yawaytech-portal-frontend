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
    timeout: 90000,
  });

  return normalizeListResponse(response.data);
}

async function fetchEmployeeMasterService(employeeCode, getState) {
  if (!employeeCode || employeeCode === "-") return null;

  try {
    const response = await axios.get(`${API_BASE}/api/${employeeCode}`, {
      headers: getAuthHeaders(getState),
      timeout: 90000,
    });
    return response.data || null;
  } catch {
    return null;
  }
}

async function fetchEmployeeBankDetailsService(employeeCode, getState) {
  if (!employeeCode || employeeCode === "-") return null;

  try {
    const response = await axios.get(
      `${API_BASE}/bank-details/${employeeCode}`,
      {
        headers: getAuthHeaders(getState),
        timeout: 90000,
      },
    );
    return response.data || null;
  } catch {
    return null;
  }
}

export async function fetchEmployeePayrollDetailService(
  employeeId,
  monthStart,
  getState,
) {
  const payrollResponse = await axios.get(
    `${API_BASE}/api/payroll/calculation/employee/${employeeId}`,
    {
      params: { month_start: monthStart },
      headers: getAuthHeaders(getState),
      timeout: 90000,
    },
  );

  const payrollData = payrollResponse.data || {};

  const employeeCode =
    payrollData?.employee_code ??
    payrollData?.employee?.employee_code ??
    payrollData?.employee_id ??
    "";

  const [employeeData, bankData] = await Promise.all([
    fetchEmployeeMasterService(employeeCode, getState),
    fetchEmployeeBankDetailsService(employeeCode, getState),
  ]);

  const merged = {
    ...payrollData,

    employee_code:
      payrollData?.employee_code ??
      employeeData?.employee_id ??
      employeeCode ??
      "-",

    employee_name:
      payrollData?.employee_name ??
      employeeData?.name ??
      payrollData?.employee?.name ??
      payrollData?.employee?.full_name ??
      payrollData?.name ??
      payrollData?.employee_code ??
      "-",

    designation:
      payrollData?.designation ??
      employeeData?.designation ??
      payrollData?.employee?.designation ??
      payrollData?.employee_designation ??
      "-",

    department:
      payrollData?.department ??
      employeeData?.department ??
      payrollData?.employee?.department ??
      payrollData?.employee?.department_name ??
      "-",

    date_of_joining:
      payrollData?.date_of_joining ??
      employeeData?.date_of_joining ??
      payrollData?.employee?.date_of_joining ??
      payrollData?.joining_date ??
      "-",

    bank_name:
      payrollData?.bank_name ??
      bankData?.bank_name ??
      payrollData?.employee?.bank_name ??
      payrollData?.bank?.name ??
      "-",

    bank_account_no:
      payrollData?.bank_account_no ??
      bankData?.account_number ??
      payrollData?.employee?.bank_account_no ??
      payrollData?.bank?.account_number ??
      "-",

    ifsc_code: payrollData?.ifsc_code ?? bankData?.ifsc_code ?? "-",

    branch_name: payrollData?.branch_name ?? bankData?.branch_name ?? "-",

    employee_profile: employeeData || null,
    bank_details: bankData || null,
  };

  return merged;
}