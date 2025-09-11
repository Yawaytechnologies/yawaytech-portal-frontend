import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchHREmployeesAPI } from "../services/hrService";

export const fetchHREmployees = createAsyncThunk(
  "hr/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchHREmployeesAPI();
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load HR employees");
    }
  }
);
