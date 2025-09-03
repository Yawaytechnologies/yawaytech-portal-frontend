// src/redux/services/authService.js

// Keep API_BASE for later real integration
export const API_BASE = "https://your-api.com"; // replace when ready

// ---- ID validation helpers ----
// Exactly 9 chars, UPPERCASE letters + digits, must contain at least one letter and one digit
const VALID_ID_REGEX = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{9}$/;
const normalizeId = (v) =>
  (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
const isValidId = (v) => VALID_ID_REGEX.test(v || "");

// Seed demo users so you can login now (uses valid 9-char IDs)
export const ensureDemoUsers = () => {
  const desiredAdmin = {
    adminId: "ADMIN0001",
    password: "Admin@123",
    name: "Yaway Admin",
  };
  const desiredEmp = {
    employeeId: "EMP000001",
    password: "Emp@123",
    name: "Jana",
  };

  // --- Admin record (parse safely, repair if corrupt/missing) ---
  let admin = null;
  try {
    const rawAdmin = localStorage.getItem("admin-user");
    admin = rawAdmin ? JSON.parse(rawAdmin) : null;
  } catch {
    // corrupt JSON -> reset below
    admin = null;
  }
  if (!admin || !isValidId(admin.adminId)) {
    localStorage.setItem("admin-user", JSON.stringify(desiredAdmin));
  } else if (admin.name !== desiredAdmin.name) {
    admin.name = desiredAdmin.name;
    localStorage.setItem("admin-user", JSON.stringify(admin));
  }

  // --- Employee record (parse safely, repair if corrupt/missing) ---
  let employee = null;
  try {
    const rawEmployee = localStorage.getItem("employee-user");
    employee = rawEmployee ? JSON.parse(rawEmployee) : null;
  } catch {
    // corrupt JSON -> reset below
    employee = null;
  }
  if (!employee || !isValidId(employee.employeeId)) {
    localStorage.setItem("employee-user", JSON.stringify(desiredEmp));
  } else if (employee.name !== desiredEmp.name) {
    employee.name = desiredEmp.name;
    localStorage.setItem("employee-user", JSON.stringify(employee));
  }

  // --- Keep current session name in sync if logged in ---
  const userRaw = localStorage.getItem("user");
  if (userRaw) {
    let user = null;
    try {
      user = JSON.parse(userRaw);
    } catch {
      user = null;
    }
    if (user?.role === "employee") {
      user.name = employee?.name || desiredEmp.name;
      localStorage.setItem("user", JSON.stringify(user));
    } else if (user?.role === "admin") {
      user.name = admin?.name || desiredAdmin.name;
      localStorage.setItem("user", JSON.stringify(user));
    }
  }
};

// Admin login (localStorage today; swap to API later)
export const loginAdminService = async ({ adminId, password }) => {
  const normalized = normalizeId(adminId);
  if (!isValidId(normalized)) {
    throw new Error(
      "Admin ID must be exactly 9 characters (A–Z, 0–9) and include letters & digits."
    );
  }

  const stored = JSON.parse(localStorage.getItem("admin-user") || "null");
  if (stored && stored.adminId === normalized && stored.password === password) {
    const token = "dummy-admin-token";
    localStorage.setItem("token", token);
    return { token, user: { ...stored, role: "admin" } };
  }
  throw new Error("Invalid admin credentials");
};

// Employee login
export const loginEmployeeService = async ({ employeeId, password }) => {
  const normalized = normalizeId(employeeId);
  if (!isValidId(normalized)) {
    throw new Error(
      "Employee ID must be exactly 9 characters (A–Z, 0–9) and include letters & digits."
    );
  }

  const stored = JSON.parse(localStorage.getItem("employee-user") || "null");
  if (
    stored &&
    stored.employeeId === normalized &&
    stored.password === password
  ) {
    const token = "dummy-emp-token";
    localStorage.setItem("token", token);
    return { token, user: { ...stored, role: "employee" } };
  }
  throw new Error("Invalid employee credentials");
};

// Employee register (local demo)
export const registerEmployeeService = async ({ employeeId, password }) => {
  const normalized = normalizeId(employeeId);
  if (!isValidId(normalized)) {
    throw new Error(
      "Employee ID must be exactly 9 characters (A–Z, 0–9) and include letters & digits."
    );
  }

  const user = { employeeId: normalized, password, name: "New Employee" };
  localStorage.setItem("employee-user", JSON.stringify(user));
  const token = "dummy-emp-token";
  localStorage.setItem("token", token);
  return { token, user: { ...user, role: "employee" } };
};

export const logoutUserService = () => {
  localStorage.removeItem("token");
};
