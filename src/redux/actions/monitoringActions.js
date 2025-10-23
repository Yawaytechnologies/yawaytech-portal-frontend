// src/redux/actions/monitoringActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiGetMonitoring } from "../services/monitoringService";

export const fetchMonitoring = createAsyncThunk(
  "monitoring/fetchMonitoring",
  async ({ employeeId, limit = 100, since, until }, { rejectWithValue }) => {
    try {
      return await apiGetMonitoring(employeeId, { limit, since, until });
    } catch (e) {
      return rejectWithValue(e.message || "Failed to load monitoring");
    }
  }
);
