import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchEmployeeByIdAPI } from "../services/employeeProfileService";

/**
 * Fetch a single employee by numeric id or employee code.
 * Returns a pruned object (snake_case fields) used by the page.
 */
export const fetchEmployeeById = createAsyncThunk(
  "employee/fetchById",
  async (identifier, { rejectWithValue }) => {
    const id = String(identifier ?? "").trim();
    if (!id) return rejectWithValue("Missing employee identifier");
    try {
      return await fetchEmployeeByIdAPI(id);
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch employee");
    }
  },
  {
    // don’t dispatch if identifier empty/whitespace
    condition: (identifier) => String(identifier ?? "").trim().length > 0,
  }
);
