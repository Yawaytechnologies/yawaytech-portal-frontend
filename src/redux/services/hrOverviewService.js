const dummyEmployees = [
  {
    employeeId: "HR001",
    name: "Rajeshwari",
    role: "HR Manager",
    email: "rajeshwari@yawaytech.com",
    phone: "9876543210",
    profile: "https://i.pravatar.cc/150?img=47",
    overview: "Handles recruitment, payroll, and employee relations.",
    jobTitle: "HR Manager",
    doj: "15-03-2021",
    dol: "—",
    pan: "ABCDE1234F",
    aadhar: "123456789012",
    dob: "12-06-1998",
    maritalStatus: "Single",
    address: "Anna Nagar, Chennai",
    GuardianName: "",
  },
  {
    employeeId: "HR002",
    name: "Jeni",
    role: "HR Executive",
    email: "jeni@yawaytech.com",
    phone: "9123456780",
    profile: "https://i.pravatar.cc/150?img=32",
    overview: "Manages onboarding, training, and engagement.",
    jobTitle: "HR Executive",
    doj: "01-02-2025",
    dol: "—",
    pan: "FGHIJ5678K",
    aadhar: "234567890123",
    dob: "25-11-2005",
    maritalStatus: "Single",
    address: "Ashok Pillar, Chennai",
    GuardianName: "Anand",
  },
];

export const fetchEmployeeByIdAPI = async (employeeId) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const id = (employeeId || "").trim();

  try {
    const response = await fetch(
      `${baseUrl}/employee/hroverview/${encodeURIComponent(id)}`
    );
    if (!response.ok) throw new Error("API error");
    return await response.json();
  } catch (error) {
    console.warn("Using dummy employee due to API error:", error.message);
    await new Promise((res) => setTimeout(res, 300));
    const fallback = dummyEmployees.find(
      (emp) => (emp.employeeId || "").toLowerCase() === id.toLowerCase()
    );
    if (!fallback) throw new Error("Employee not found");
    return fallback;
  }
};
