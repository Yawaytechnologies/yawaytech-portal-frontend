// src/redux/services/newEmployeeService.js

const RAW = import.meta.env?.VITE_API_BASE_URL ?? "";
const API_URL = RAW.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Create .env.local and restart Vite.",
  );
}

async function readBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

export async function createEmployeeForm(formData, token) {
  const url = `${API_URL}/api/employee/form/`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json",
    },
    body: formData,
  });

  const data = await readBody(res);

  if (!res.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((d) => d.msg).join(", ")
      : data?.detail || res.statusText || "Failed to create employee";
    throw new Error(detail);
  }

  return data;
}

// ✅ LIST
export async function listEmployeesApi(token) {
  // ⚠️ keep your correct endpoint (from swagger)
  const url = `${API_URL}/api/`; // change if needed

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json",
    },
  });

  const data = await readBody(res);

  if (!res.ok) {
    const detail =
      data?.detail || res.statusText || "Failed to fetch employees";
    throw new Error(detail);
  }

  return data;
}

// ✅ UPDATE (EDIT)
// swagger: PUT /api/{employee_id}
export async function updateEmployeeById(employeeId, payloadJson, token) {
  const url = `${API_URL}/api/${encodeURIComponent(employeeId)}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payloadJson),
  });

  const data = await readBody(res);

  if (!res.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((d) => d.msg).join(", ")
      : data?.detail || res.statusText || "Failed to update employee";
    throw new Error(detail);
  }

  return data;
}

// ✅ DELETE
// swagger: DELETE /api/{employee_id}
export async function deleteEmployeeById(employeeId, token) {
  const url = `${API_URL}/api/${encodeURIComponent(employeeId)}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json",
    },
  });

  const data = await readBody(res);

  if (!res.ok) {
    const detail =
      data?.detail || res.statusText || "Failed to delete employee";
    throw new Error(detail);
  }

  return data;
}
