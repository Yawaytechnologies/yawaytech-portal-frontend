// src/redux/services/employeesService.js
const RAW = import.meta.env?.VITE_API_BASE_URL ?? "";
const API_URL =
  RAW.replace(/\/+$/, ""); // remove trailing slash

  if (!API_URL) {
  throw new Error("VITE_API_BASE_URL is not set. Create .env.local and restart Vite.");
}

export async function createEmployeeForm(formData, token) {
  const res = await fetch(`${API_URL}/api/employees/form/`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // DO NOT set Content-Type for FormData
      Accept: "application/json",
    },
    body: formData,
  });   

  // Parse response (try JSON first)
  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore parsing errors (like empty response)
  }

  if (!res.ok) {
    const detail =
      Array.isArray(data?.detail)
        ? data.detail.map((d) => d.msg).join(", ")
        : data?.detail || res.statusText || "Failed to create employee";
    throw new Error(detail);
  }
  return data;
}
