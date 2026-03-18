import { createAsyncThunk } from "@reduxjs/toolkit";
import { shiftsService } from "../services/shiftsService";

export const fetchCurrentShift = createAsyncThunk(
  "shifts/fetchCurrentShift",
  async ({ employeeId, targetDate }, { rejectWithValue }) => {
    try {
      return await shiftsService.getCurrentShift(employeeId, targetDate);
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

export const assignEmployeeShift = createAsyncThunk(
  "shifts/assignEmployeeShift",
  async (payload, { rejectWithValue }) => {
    try {
      return await shiftsService.assignShift(payload);
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);
