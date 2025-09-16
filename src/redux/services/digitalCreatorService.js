// src/redux/services/digitalCreatorService.js

/* ----------------------------- utils ------------------------------------ */
const normalizeBase = (u) => (u?.endsWith("/") ? u : `${u}/`);
const normalizeEmployee = (e = {}) => {
  const employeeId =
    e.employee_id ?? e.employeeId ?? (e.id != null ? String(e.id) : "");
  const designation = e.designation ?? e.role ?? e.jobTitle ?? null;

  return {
    id: e.id ?? null,
    employeeId,
    name: e.name ?? "—",
    // keep both:
    role: designation || "—",
    designation, // <- keep raw-ish for components that expect this field
    email: e.email ?? "—",
    profile: e.profile || `https://i.pravatar.cc/150?u=${employeeId || e.id || e.email || "x"}`,
    department: e.department ?? "—",
    _raw: e,
  };
};


/* --------------------------- fallback data ------------------------------ */
const dummyCreators = [
  {
    id: 9999,
    employee_id: "DC002",
    name: "Arun",
    designation: "Digital Creator",
    email: "arun@yawaytech.com",
    profile: "https://i.pravatar.cc/150?img=14",
    department: "IT",
  },
];

/* ------------------------------ service --------------------------------- */
export async function fetchDigitalCreatorsAPI() {
  const base = normalizeBase(
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/"
  );
  // Adjust to singular if your backend is `/api/employee/`
  const url = `${base}api/dashboard/employees?department=Other&limit=20&offset=0`;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text();

    if (!res.ok) {
      console.error("CREATORS LIST ERROR", res.status, text);
      throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = [];
    }

    console.log("CREATORS RAW:", data);

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

    console.log("CREATORS NORMALIZED:", normalized);
    return normalized;
  } catch (e) {
    console.warn("Creators API failed, using dummy:", e.message);
    await new Promise((r) => setTimeout(r, 200));
    return dummyCreators.map(normalizeEmployee);
  }
}
