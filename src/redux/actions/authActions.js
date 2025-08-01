// src/redux/actions/authActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  signupUserService,
  loginUserService,
  logoutUserService,
} from "../services/authService";

// ✅ Signup Action with name storing

export const signupUser = createAsyncThunk("auth/signup", async (formData, thunkAPI) => {
  try {
    const response = await signupUserService(formData);

    // Save to localStorage if API doesn't store it
    const userData = response?.user || response;

    if (userData && userData.name) {
      localStorage.setItem("userName", userData.name);
    }

    return userData;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Signup failed");
  }
});

// ✅ Login Action with localStorage support
export const loginUser = createAsyncThunk(
  "auth/login",
  async (formData, thunkAPI) => {
    try {
      const response = await loginUserService(formData);

      if (response?.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      return response;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// ✅ Logout Action
export const logoutUser = createAsyncThunk("auth/logout", async () => {
  logoutUserService();
  localStorage.removeItem("user");
  return null;
});
