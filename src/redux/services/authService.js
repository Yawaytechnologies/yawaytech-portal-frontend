// src/redux/services/authService.js

const API_BASE = "https://your-api.com"; // Replace with real API

export const loginUserService = async ({ email, password }) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error("API login failed");

    const data = await res.json();
    localStorage.setItem("token", data.token);
    return { token: data.token, user: data.user };
  } catch {
    // Fallback to localStorage
    const stored = JSON.parse(localStorage.getItem("yaway-user"));
    if (stored && stored.email === email && stored.password === password) {
      const token = "dummy-token";
      localStorage.setItem("token", token);
      return { token, user: stored };
    }
    throw new Error("Invalid credentials");
  }
};

export const signupUserService = async (userData) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!res.ok) throw new Error("API signup failed");

    const data = await res.json();
    localStorage.setItem("token", data.token);
    return { token: data.token, user: data.user };
  } catch {
    // Fallback to localStorage
    const newUser = { ...userData };
    localStorage.setItem("yaway-user", JSON.stringify(newUser));
    const token = "dummy-token";
    localStorage.setItem("token", token);
    return { token, user: newUser };
  }
};

export const logoutUserService = () => {
  localStorage.removeItem("token");
};
