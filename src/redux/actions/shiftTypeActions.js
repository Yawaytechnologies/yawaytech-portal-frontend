import { createAsyncThunk } from "@reduxjs/toolkit";
import { shiftTypeService } from "../services/shiftTypeService";

// adjust if your token stored elsewhere
const selectToken = (state) => state?.auth?.token || state?.authSession?.token;

// ✅ NO GET API -> load from localStorage (initially empty)
export const fetchShiftTypes = createAsyncThunk(
  "shiftType/fetchShiftTypes",
  async (_, { rejectWithValue }) => {
    try {
      return shiftTypeService.getLocalList();
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load shifts");
    }
  },
);

// ✅ POST -> add to redux + localStorage
export const addShiftType = createAsyncThunk(
  "shiftType/addShiftType",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const token = selectToken(getState());
      const created = await shiftTypeService.createShift(payload, token);

      // store locally so table shows it even without GET API
      shiftTypeService.addLocal(created);

      return created;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.detail ||
          err?.response?.data ||
          err?.message ||
          "Failed to create shift",
      );
    }
  },
);
