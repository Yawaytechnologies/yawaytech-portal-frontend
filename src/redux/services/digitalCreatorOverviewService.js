// src/redux/services/dcOverviewService.js

// ---- dummy list (keep yours / extend as needed) ----
const dummyCreators = [
  {
    employeeId: "DC002",
    name: "Ajay",
    role: "Digital Creator",
    email: "arun@yawaytech.com",
    phone: "9000000002",
    profile: "https://i.pravatar.cc/150?img=14",
    overview: "Shoots/edit videos, thumbnails, and social media campaigns.",
    jobTitle: "Digital Creator",
    doj: "05-08-2025",
    dol: "—",
    pan: "BBBBB5678B",
    aadhar: "888877776666",
    dob: "03-06-2002",
    maritalStatus: "Single",
    address: "Virudhachalam, Vilupuram",
    GuardianName: "",
    guardianPhone: "9090909091",
    bloodGroup: "A+",
  },
];

// ---- env base (supports either var) ----
const base = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  "/"
).replace(/\/+$/, "/");

// ---- normalize any backend shape to UI shape ----
const mapBackendToCreator = (e = {}, fallbackId = "") => ({
  employeeId: e.employee_id || e.employeeId || e.code || fallbackId,
  name: e.name || e.employee_name || fallbackId,
  jobTitle: e.job_title || e.designation || e.role || e.title || "Digital Creator",
  role: e.role || e.designation || "Digital Creator",
  email: e.email || "",
  phone: e.phone || e.mobile || "",
  profile: e.profile || e.profile_picture || e.photo_url || e.avatar || null,
  overview: e.overview || e.bio || "",
  doj: e.doj || e.date_of_joining || "",
  dol: e.dol || e.date_of_leaving || "—",
  pan: e.pan || "",
  aadhar: e.aadhar || e.aadhaar || "",
  dob: e.dob || e.date_of_birth || "",
  maritalStatus: e.maritalStatus || e.marital_status || "",
  address: e.address || "",
  GuardianName: e.guardian_name || e.GuardianName || "",
  guardianPhone: e.guardian_phone || e.guardianPhone || "",
  bloodGroup: e.blood_group || e.bloodGroup || "",
});

/**
 * Tries common business-key endpoints, then falls back to dummy list.
 */
export const fetchDigitalCreatorByIdAPI = async (employeeId) => {
  const id = String(employeeId || "").trim();
  const enc = encodeURIComponent(id);

  const candidates = [
    `${base}api/creators/${enc}`,
    `${base}api/employees/${enc}`, // many backends reuse employees route
    `${base}api/creators/code/${enc}`,
    `${base}api/creators/by-employee-id/${enc}`,
  ];

  // 1) Try backend
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (res.ok) {
        const payload = await res.json();
        return mapBackendToCreator(payload, id);
      }
    } catch {
      // try next
    }
  }

  // 2) Fallback to dummy
  const fallback = dummyCreators.find(
    (x) => String(x.employeeId || "").toLowerCase() === id.toLowerCase()
  );
  if (fallback) return mapBackendToCreator(fallback, id);

  // 3) Safe minimal object so the card never breaks
  return mapBackendToCreator({}, id);
};

export default { fetchDigitalCreatorByIdAPI };
