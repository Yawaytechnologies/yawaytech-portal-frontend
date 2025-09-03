import { createSlice } from "@reduxjs/toolkit";
import { loginAdmin, loginEmployee, registerEmployee, logoutUser } from "../actions/authActions";

const initialState = {
  token: localStorage.getItem("token") || null,
  user: JSON.parse(localStorage.getItem("user") || "null"),
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
      });
  },
});

export default authSlice.reducer;
