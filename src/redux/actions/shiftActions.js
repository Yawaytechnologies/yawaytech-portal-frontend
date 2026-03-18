import { createAsyncThunk } from "@reduxjs/toolkit";
import * as shiftService from "../services/shiftService";

export const fetchCurrentShift = createAsyncThunk(
  "shift/fetchCurrentShift",
  async ({ employeeId, targetDate }, { rejectWithValue }) => {
    try {
      return await shiftService.getCurrentShift(employeeId, targetDate);
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to fetch current shift");
    }
  },
);