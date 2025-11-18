// src/redux/services/departmentOverviewService.js
const rawBase = import.meta.env.VITE_API_BASE_URL || "";
const BASE_URL = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

// Accept IDs like YTPL019IT (uppercase letters+digits, 6–20 chars)
export const EMP_ID_RE = /^[A-Z0-9]{6,20}$/;

export async function getEmployeeById(employeeId) {
  if (!employeeId) throw new Error("employeeId is required");
  const id = String(employeeId).trim().toUpperCase();

  if (!EMP_ID_RE.test(id)) {
    // Fail fast on the client
    throw new Error("Invalid employee ID format");
  }

  // 🔁 IMPORTANT: match backend route GET /api/{employee_id}
  const url = `${BASE_URL}/api/${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    credentials: "include",
  });

  if (res.status === 404) {
    throw new Error("Employee not found");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch ${id}: ${res.status} ${text}`);
  }
  return res.json();
}
