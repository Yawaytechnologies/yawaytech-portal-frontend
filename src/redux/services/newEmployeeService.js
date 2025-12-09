// src/redux/services/newEmployeeService.js

const RAW = import.meta.env?.VITE_API_BASE_URL ?? "";
const API_URL = RAW.replace(/\/+$/, ""); // remove trailing slash

if (!API_URL) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Create .env.local and restart Vite."
  );
}

export async function createEmployeeForm(formData, token) {
  // 🔥 must end with trailing slash → backend requires it
  const url = `${API_URL}/api/employee/form/`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json",
      // ❌ DO NOT manually set Content-Type for FormData
    },
    body: formData,
  });

  // backend may return either JSON or raw text
  let data = null;
  try {
    data = await res.json();
    const text = await res.text();
    console.log("RAW ERROR TEXT:", text);    // 👀 FORCE LOG BACKEND ERROR
   try {
     data = JSON.parse(text);
   } catch {
     data = { detail: text };
   }
  } catch {
    // ignore non-JSON bodies
  }

  if (!res.ok) {
    console.error("BACKEND ERROR RAW:", data);
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((d) => d.msg).join(", ")
      : data?.detail || res.statusText || "Failed to create employee";
    throw new Error(detail);
  }

  return data;
}
