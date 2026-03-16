// src/redux/services/payrollPolicyService.js
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

export async function listPolicies() {
  try {
    const res = await http.get("/policies/");
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to load policies"));
  }
}

export async function getPolicy(policyId) {
  try {
    const res = await http.get(`/policies/${policyId}`);
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to load policy"));
  }
}

export async function createPolicy(payload) {
  try {
    const res = await http.post("/policies/", payload);
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to create policy"));
  }
}

export async function updatePolicy(policyId, payload) {
  try {
    const res = await http.put(`/policies/${policyId}`, payload);
    return res.data;
  } catch (err) {
    throw new Error(apiErr(err, "Failed to update policy"));
  }
}

export async function deletePolicy(policyId) {
  try {
    const res = await http.delete(`/policies/${policyId}`);
    return res.data; // often string
  } catch (err) {
    throw new Error(apiErr(err, "Failed to delete policy"));
  }
}