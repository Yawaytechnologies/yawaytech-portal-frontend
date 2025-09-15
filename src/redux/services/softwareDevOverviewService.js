// src/redux/services/softwareDevOverviewService.js

// ---- dummy list (optional, extend as needed) ----
const dummyDevelopers = [
  {
    employeeId: "SE001",
    name: "Praveen Kumar",
    jobTitle: "Senior Software Engineer",
    profile: "https://i.pravatar.cc/150?img=12",
  },
  {
    employeeId: "SE002",
    name: "Sowjanya",
    jobTitle: "Software Engineer",
    profile: "https://i.pravatar.cc/150?img=23",
  },
];

// ---- env base (supports either var; ensure single trailing slash) ----
const base = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "/"
).replace(/\/+$/, "/");

const mapBackendToDev = (e = {}, fallbackId = "") => ({
  employeeId: e.employee_id || e.employeeId || e.code || fallbackId,
  name: e.name || e.employee_name || fallbackId,
  jobTitle: e.job_title || e.designation || e.role || e.title || "",
  profile: e.profile || e.profile_picture || e.photo_url || e.avatar || null,
});

/** ✅ NAMED export required by your action file */
export async function fetchSoftwareDeveloperByIdAPI(employeeId) {
  const id = String(employeeId || "").trim();
  const enc = encodeURIComponent(id);

  const candidates = [
    `${base}api/developers/${enc}`,
    `${base}api/employees/${enc}`, // common fallback
    `${base}api/developers/code/${enc}`,
    `${base}api/developers/by-employee-id/${enc}`,
  ];

  // Try backend endpoints
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (res.ok) {
        const payload = await res.json();
        return mapBackendToDev(payload, id);
      }
    } catch {
      /* try next */
    }
  }

  // Fallback to dummy
  const fallback = dummyDevelopers.find(
    d => String(d.employeeId || "").toLowerCase() === id.toLowerCase()
  );
  if (fallback) return mapBackendToDev(fallback, id);

  // Last resort: safe minimal object (prevents UI from breaking)
  return mapBackendToDev({}, id);
}

// Optional aliases to be flexible elsewhere
export { fetchSoftwareDeveloperByIdAPI as fetchDeveloperByIdAPI };

// Optional default export (does NOT affect named import)
export default { fetchSoftwareDeveloperByIdAPI };
