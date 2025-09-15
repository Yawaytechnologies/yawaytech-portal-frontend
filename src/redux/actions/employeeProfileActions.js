// src/redux/actions/employeeProfileActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchEmployeeByIdAPI } from "../services/employeeProfileService";

export const fetchEmployeeById = createAsyncThunk(
  "employee/fetchById",
  async (identifier, { rejectWithValue }) => {
    try {
      const emp = await fetchEmployeeByIdAPI(identifier);
      return emp;
    } catch (err) {
      // Pass error text to slice; slice may decide to load DEMO instead.
      return rejectWithValue(err?.message || "Failed to fetch employee");
    }
  }
);
