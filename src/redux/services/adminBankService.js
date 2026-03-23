// src/redux/services/adminBankService.js
import axios from "axios";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

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

/* ── GET /bank-details/  (list all) ── */
export async function listBankDetails() {
  try {
    const res = await http.get("/bank-details/");
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to fetch bank details"));
  }
}

/* ── GET /bank-details/{employee_id} ── */
export async function getBankDetail(employeeId) {
  try {
    const res = await http.get(
      `/bank-details/${encodeURIComponent(employeeId)}`,
    );
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to fetch bank detail"));
  }
}

/* ── POST /bank-details/ ── */
export async function createBankDetail(payload) {
  try {
    const res = await http.post("/bank-details/", {
      employee_id: payload.employee_id,
      bank_name: payload.bank_name,
      account_number: String(payload.account_number),
      ifsc_code: payload.ifsc_code,
      branch_name: payload.branch_name,
    });
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to create bank detail"));
  }
}

/* ── PUT /bank-details/{employee_id} ── */
export async function updateBankDetail(employeeId, payload) {
  try {
    const res = await http.put(
      `/bank-details/${encodeURIComponent(employeeId)}`,
      {
        bank_name: payload.bank_name,
        account_number: String(payload.account_number),
        ifsc_code: payload.ifsc_code,
        branch_name: payload.branch_name,
      },
    );
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to update bank detail"));
  }
}

/* ── DELETE /bank-details/{employee_id} ── */
export async function deleteBankDetail(employeeId) {
  try {
    const res = await http.delete(
      `/bank-details/${encodeURIComponent(employeeId)}`,
    );
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to delete bank detail"));
  }
}
