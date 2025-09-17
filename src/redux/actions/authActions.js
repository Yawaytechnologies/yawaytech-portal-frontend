import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginAdminService,
  loginEmployeeService,
  registerEmployeeService,
  logoutUserService,
} from "../services/authService";

export const loginAdmin = createAsyncThunk("auth/loginAdmin", async (payload, thunkAPI) => {
  try {
    const res = await loginAdminService(payload);
    localStorage.setItem("user", JSON.stringify(res.user));
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Login failed");
  }
});

export const loginEmployee = createAsyncThunk("auth/loginEmployee", async (payload, thunkAPI) => {
  try {
    const res = await loginEmployeeService(payload);
    localStorage.setItem("user", JSON.stringify(res.user));
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Login failed");
  }
});

export const registerEmployee = createAsyncThunk("auth/registerEmployee", async (payload, thunkAPI) => {
  try {
    const res = await registerEmployeeService(payload);
    localStorage.setItem("user", JSON.stringify(res.user));
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Registration failed");
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  logoutUserService();
  localStorage.removeItem("user");
  return null;
});
