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
    doj: "05-08-2025", dol: "—",
    pan: "BBBBB5678B", aadhar: "888877776666",
    dob: "03-06-2002", maritalStatus: "Single",
    address: "Virudhachalam, Vilupuram", GuardianName: "",
  },
];

export const fetchDigitalCreatorByIdAPI = async (employeeId) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const id = (employeeId || "").trim();

  try {
    const res = await fetch(`${baseUrl}/employee/creator-overview/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (e) {
    console.warn("Using creator dummy due to API error:", e.message);
    await new Promise((r) => setTimeout(r, 300));
    const fallback = dummyCreators.find(
      (x) => (x.employeeId || "").toLowerCase() === id.toLowerCase()
    );
    if (!fallback) throw new Error("Creator not found");
    return fallback;
  }
};
