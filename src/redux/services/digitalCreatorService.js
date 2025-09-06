const dummyCreators = [
 
  {
    employeeId: "DC002",
    name: "Arun",
    role: "Digital Creator",
    email: "arun@yawaytech.com",
    phone: "9000000002",
    profile: "https://i.pravatar.cc/150?img=14",
  },
];

export const fetchDigitalCreatorsAPI = async () => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  try {
    const res = await fetch(`${baseUrl}/employee/creators`);
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (e) {
    console.warn("Using creators dummy data:", e.message);
    await new Promise((r) => setTimeout(r, 300));
    return dummyCreators;
  }
};
