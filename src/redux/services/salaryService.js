// src/redux/services/salaryService.js
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

export async function listSalaries() {
  try {
    const res = await http.get("/salaries/");
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to fetch salaries"));
  }
}

export async function createSalary(payload) {
  try {
    const res = await http.post("/salaries/", payload);
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to create salary"));
  }
}

export async function updateSalary(salaryId, payload) {
  try {
    const res = await http.put(`/salaries/${salaryId}`, payload);
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to update salary"));
  }
}

export async function deleteSalary(salaryId) {
  try {
    const res = await http.delete(`/salaries/${salaryId}`);
    return res.data; // backend returns string sometimes
  } catch (err) {
    throw new Error(apiErr(err, "Failed to delete salary"));
  }
}