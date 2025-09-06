const dummyDevelopers = [
  {
    employeeId: "SE001",
    name: "Praveen Kumar",
    role: "Senior Software Engineer",
    email: "praveen@yawaytech.com",
    phone: "9898989898",
    profile: "https://i.pravatar.cc/150?img=12",
    overview: "Builds scalable services, code reviews, and deployment automation.",
    jobTitle: "Best Software developer Award Goes to ivaruku",
    doj: "10-01-2025",
    dol: "—",
    pan: "PQRSX1234Z",
    aadhar: "456712349012",
    dob: "21-08-2002",
    maritalStatus: "Married",
    address: "Sunguvachattiram, Sriperambathur",
    GuardianName: "Vismaiya nair",
  },
  {
    employeeId: "SE002",
    name: "Sowjanya",
    role: "Software Engineer",
    email: "sowjanya@yawaytech.com",
    phone: "9797979797",
    profile: "https://i.pravatar.cc/150?img=23",
    overview: "Frontend specialist in React, charts, and reusable UI systems.",
    jobTitle: "First Software Engineer of Yaway",
    doj: "15-09-2022",
    dol: "—",
    pan: "LMNOP5678Q",
    aadhar: "567812349012",
    dob: "09-11-1998",
    maritalStatus: "Single",
    address: "Velachery, Chennai",
    GuardianName: "",
  },
];

export const fetchSoftwareDeveloperByIdAPI = async (employeeId) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const id = (employeeId || "").trim();

  try {
    const res = await fetch(`${baseUrl}/employee/engineer-overview/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    console.warn("Using developer dummy due to API error:", err.message);
    await new Promise((r) => setTimeout(r, 300));
    const fallback = dummyDevelopers.find(
      (emp) => (emp.employeeId || "").toLowerCase() === id.toLowerCase()
    );
    if (!fallback) throw new Error("Developer not found");
    return fallback;
  }
};
