// Normalize API employee object
export const normalizeEmployee = (e = {}) => {
  const employeeId = e.employee_id ?? e.employeeId ?? (e.id != null ? String(e.id) : "");

  // Convert Base64 profile picture to data URL
  let profileUrl = null;
  if (e.profile_picture) {
    profileUrl = `data:image/jpeg;base64,${e.profile_picture}`;
  }

  return {
    id: e.id ?? null,
    employeeId,
    name: e.name ?? "—",
    role: e.designation ?? e.role ?? "—",
    email: e.email ?? "—",
    profile: profileUrl,
    department: e.department ?? "—",
  };
};

// Fetch software developers from backend
export async function fetchSoftwareDevelopersAPI() {
  const base = import.meta.env.VITE_API_BASE_URL || "https://yawaytech-portal-backend-python-2.onrender.com";
  const url = `${base.replace(/\/$/, "")}/api/dashboard/employees?department=IT&limit=20&offset=0`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();

  if (!res.ok) throw new Error(`API ${res.status}: ${text || res.statusText}`);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = [];
  }

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.results)
    ? data.results
    : [];

  return list.map(normalizeEmployee);
}
