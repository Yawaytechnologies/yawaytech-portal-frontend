import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:8000";

const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("ytp_token") ||
    ""
  );
}

http.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

const apiErr = (err, fallback) =>
  err?.response?.data?.detail ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

// GET /salaries/
// Returns: [ { id, employee_id, base_salary, payroll_policy_id, gross_salary, breakdowns[] } ]
export async function listSalaries() {
  try {
    const res = await http.get("/salaries/");
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to fetch salaries"));
  }
}

// POST /salaries/
// payload: { employee_id: number, base_salary: number, payroll_policy_id: number }
export async function createSalary(payload) {
  try {
    const res = await http.post("/salaries/", payload);
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to create salary"));
  }
}

// PUT /salaries/{salary_id}
// payload: { base_salary: number, payroll_policy_id: number }
// Note: employee_id is NOT sent on update per backend schema (only base_salary + payroll_policy_id)
export async function updateSalary(salaryId, payload) {
  try {
    const res = await http.put(`/salaries/${salaryId}`, payload);
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to update salary"));
  }
}

// DELETE /salaries/{salary_id}
export async function deleteSalary(salaryId) {
  try {
    const res = await http.delete(`/salaries/${salaryId}`);
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to delete salary"));
  }
}