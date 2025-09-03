const dummyEmployees = [
  {
    employeeId: "HR001",
    name: "Rajeshwari",
    role: "HR Manager",
    email: "rajeshwari@yawaytech.com",
    phone: "9876543210",
    profile: "https://i.pravatar.cc/150?img=47",
  },
  {
    employeeId: "HR002",
    name: "Jeni",
    role: "HR Executive",
    email: "jeni@yawaytech.com",
    phone: "9123456780",
    profile: "https://i.pravatar.cc/150?img=32",
  },
];

export const fetchHREmployeesAPI = async () => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  try {
    const response = await fetch(`${baseUrl}/employee/hr`);
    if (!response.ok) throw new Error("API error");
    return await response.json();
  } catch (error) {
    console.warn("Using dummy data:", error.message);
    await new Promise((res) => setTimeout(res, 300));
    return dummyEmployees;
  }
};
