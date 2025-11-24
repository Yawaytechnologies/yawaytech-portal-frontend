// src/redux/services/employeesService.js
const RAW = import.meta.env?.VITE_API_BASE_URL ?? "";
const API_URL = RAW.replace(/\/+$/, ""); // remove trailing slash at end

if (!API_URL) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Create .env.local and restart Vite."
  );
}

export async function createEmployeeForm(formData, token) {
  const url = `${API_URL}/api/employee/form`; // ✅ singular, no trailing slash

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // DO NOT set Content-Type for FormData – browser will set correct boundary
      Accept: "application/json",
    },
    body: formData,
  });

  // Try to parse JSON (backend might return error details)
  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore parsing errors (plain text / empty body etc.)
  }

  if (!res.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((d) => d.msg).join(", ")
      : data?.detail || res.statusText || "Failed to create employee";
    throw new Error(detail);
  }

  return data;
}
