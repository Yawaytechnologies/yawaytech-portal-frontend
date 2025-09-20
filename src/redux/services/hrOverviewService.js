// src/redux/services/hrOverviewService.js
const base =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  "/";

/**
 * Tries common backend routes that fetch an employee by their *business key* (employee_id),
 * then normalizes field names so the UI can render consistently.
 */
export const fetchEmployeeByIdAPI = async (employeeId) => {
  const id = encodeURIComponent(String(employeeId || "").trim());

  const candidates = [
    `${base}api/employees/${id}`,                // e.g. GET /api/employees/YTPL506IT
    `${base}api/employees/code/${id}`,          // e.g. GET /api/employees/code/YTPL506IT
    `${base}api/employees/by-employee-id/${id}` // e.g. GET /api/employees/by-employee-id/YTPL506IT
  ];

  let payload = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (res.ok) {
        payload = await res.json();
        break;
      }
    } catch {
      // try next candidate
    }
  }

  if (!payload) {
    // let caller decide; they'll fall back to a lightweight card so page never breaks
    const err = new Error("EMP404");
    err.code = "EMP404";
    throw err;
  }

  const e = payload;
  return {
    employeeId: e.employee_id || e.employeeId || e.code || employeeId,
    name: e.name || e.employee_name || employeeId,
    jobTitle: e.job_title || e.designation || e.role || "",
    profile: e.profile || e.profile_picture || e.photo_url || e.avatar || null,
  };
};
