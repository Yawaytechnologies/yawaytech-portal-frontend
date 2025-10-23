import { createSlice } from "@reduxjs/toolkit";
import { loginAdmin, loginEmployee, registerEmployee, logoutUser } from "../actions/authActions";

const SESSION_MAX_MS = 12 * 60 * 60 * 1000;

// --- sanitize persisted auth on boot (so app starts at login if stale) ---
const rawToken = localStorage.getItem("token") || null;
const rawUser = localStorage.getItem("user");
const rawExpires = Number(localStorage.getItem("expiresAt") || 0);
const now = Date.now();
const bootHasValidSession = !!rawToken && !!rawExpires && now < rawExpires;

if (!bootHasValidSession) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("expiresAt");
}

const initialState = {
  token: bootHasValidSession ? rawToken : null,
  user: bootHasValidSession ? JSON.parse(rawUser || "null") : null,
  expiresAt: bootHasValidSession ? rawExpires : 0,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const ok = (state, action) => {
      state.loading = false;
      state.error = null;
      state.token = action.payload.token;
      state.user = action.payload.user;
      const exp = Date.now() + SESSION_MAX_MS;
      state.expiresAt = exp;
      localStorage.setItem("expiresAt", String(exp));
    };
    const fail = (state, action) => {
      state.loading = false;
      state.error = action.payload || "Request failed";
    };

    builder
      .addCase(loginAdmin.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginAdmin.fulfilled, ok)
      .addCase(loginAdmin.rejected, fail)

      .addCase(loginEmployee.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginEmployee.fulfilled, ok)
      .addCase(loginEmployee.rejected, fail)

      .addCase(registerEmployee.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(registerEmployee.fulfilled, ok)
      .addCase(registerEmployee.rejected, fail)

      .addCase(logoutUser.fulfilled, (s) => {
        s.loading = false;
        s.error = null;
        s.token = null;
        s.user = null;
        s.expiresAt = 0;
      });
  },
});

export default authSlice.reducer;
