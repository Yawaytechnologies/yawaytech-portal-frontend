// src/redux/actions/departmentOverviewAction.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getEmployeeById } from "../services/departmentOverviewService";

/**
 * Thunk: fetch details by employeeId (department is only for routing/UX).
 */
export const fetchDepartmentEmployeeById = createAsyncThunk(
  "departmentOverview/fetchById",
  async ({ employeeId }, { rejectWithValue }) => {
    try {
      const data = await getEmployeeById(employeeId);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Unable to load employee");
    }
  }
);

/** Simple action type for clearing state from component before a new load */
export const DEPARTMENT_DETAIL_RESET = "DEPARTMENT_DETAIL_RESET";
