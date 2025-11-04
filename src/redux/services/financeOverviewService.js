// src/redux/services/financeOverviewService.js
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://yawaytech-portal-backend-python-2.onrender.com/";

/** GET /api/employees/:id */
export const fetchFinanceByIdAPI = async (employeeId) => {
  const id = encodeURIComponent(String(employeeId || "").trim());
  const url = `${baseURL}api/employees/${id}`;

  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("Employee not found");

  const e = await res.json();

  return {
    employeeId: e.employee_id || e.employeeId || id,
    name: e.name || e.employee_name || id,
    jobTitle: e.designation || e.job_title || e.role || "—",
    email: e.email || "—",
    mobile: e.mobile_number || e.phone || e.mobile || "—",
    date_of_joining: e.date_of_joining || e.doj || "—",
    date_of_leaving: e.date_of_leaving || e.dol || "—",
    pan: e.pan || e.panNumber || "—",
    aadhar: e.aadhar || e.aadhaar || e.aadharNumber || e.aadhaarNumber || "—",
    dob: e.date_of_birth || e.dob || "—",
    marital_status: e.marital_status || e.maritalStatus || "—",
    guardian_name: e.father_name || e.guardian_name || e.parentName || "—",
    guardian_phone: e.guardian_phone || e.guardianPhone || e.parentPhone || "—",
    blood_group: e.blood_group || e.bloodGroup || e.bloodType || "—",
    address: e.permanent_address || e.address || "—",
    overview: e.overview || "—",
    profile: e.profile_picture ? `data:image/png;base64,${e.profile_picture}` : null,
  };
};
