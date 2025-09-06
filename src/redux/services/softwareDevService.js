// Dummy list (fallback when API fails)
const dummyDevelopers = [
  {
    employeeId: "SE001",
    name: "Praveen Kumar",
    role: "Best Software developer Award Goes to ivaruku",
    email: "praveen@yawaytech.com",
    phone: "9898989898",
    profile: "https://i.pravatar.cc/150?img=12",
  },
  {
    employeeId: "SE002",
    name: "Sowjanya",
    role: "First Software Engineer of Yaway",
    email: "Sowjanya@yawaytech.com",
    phone: "9797979797",
    profile: "https://i.pravatar.cc/150?img=23",
  },
];

export const fetchSoftwareDevelopersAPI = async () => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  try {
    const res = await fetch(`${baseUrl}/employee/engineers`);
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    console.warn("Using developers dummy data:", err.message);
    await new Promise((r) => setTimeout(r, 300));
    return dummyDevelopers;
  }
};
