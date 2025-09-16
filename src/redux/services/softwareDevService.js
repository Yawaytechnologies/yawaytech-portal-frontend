// src/redux/services/softwareDeveloperService.js

/* ----------------------------- utils ------------------------------------ */
const normalizeBase = (u) => (u?.endsWith("/") ? u : `${u}/`);

const normalizeEmployee = (e = {}) => {
  const employeeId = e.employee_id ?? e.employeeId ?? (e.id != null ? String(e.id) : "");
  const designation = e.designation ?? e.role ?? e.jobTitle ?? null;
  return {
    id: e.id ?? null,
    employeeId,
    name: e.name ?? "—",
    role: designation || "—",
    designation,                       // keep raw-ish like HR
    email: e.email ?? "—",
    profile: e.profile || `https://i.pravatar.cc/150?u=${employeeId || e.id || e.email || "x"}`,
    department: e.department ?? "—",
    _raw: e,
  };
};

/* --------------------------- fallback data ------------------------------ */
const dummyDevelopers = [
  {
    id: 9001,
    employee_id: "SE001",
    name: "Praveen Kumar",
    designation: "Best Software developer Award Goes to ivaruku",
    email: "praveen@yawaytech.com",
    profile: "https://i.pravatar.cc/150?img=12",
    department: "IT",
  },
  {
    id: 9002,
    employee_id: "SE002",
    name: "Sowjanya",
    designation: "First Software Engineer of Yaway",
    email: "Sowjanya@yawaytech.com",
    profile: "https://i.pravatar.cc/150?img=23",
    department: "IT",
  },
];

/* ------------------------------ service --------------------------------- */
export async function fetchSoftwareDevelopersAPI() {
  const base =
    normalizeBase(
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      "http://127.0.0.1:8000/"
    );

  const url = `${base}api/dashboard/employees?department=IT&limit=20&offset=0`; // mirror HR service (trailing slash)

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text(); // log-friendly

    if (!res.ok) {
      console.error("SW DEV LIST ERROR", res.status, text);
      throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }

    let data;
    try { data = JSON.parse(text); } catch { data = []; }

    console.log("SW DEV RAW:", data);

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.results)
      ? data.results
      : data
      ? [data]
      : [];

    const normalized = list.map(normalizeEmployee);
    console.log("SW DEV NORMALIZED:", normalized);

    // Optional strict filter (off by default to avoid empty UI):
    // const ONLY_SOFTWARE = false;
    // return ONLY_SOFTWARE
    //   ? normalized.filter((p) =>
    //       `${p.role || ""}`.toLowerCase().includes("software")
    //         || `${p.designation || ""}`.toLowerCase().includes("developer")
    //     )
    //   : normalized;

    return normalized;
  } catch (err) {
    console.warn("Using developers dummy data:", err.message);
    await new Promise((r) => setTimeout(r, 200));
    return dummyDevelopers.map(normalizeEmployee);
  }
}
