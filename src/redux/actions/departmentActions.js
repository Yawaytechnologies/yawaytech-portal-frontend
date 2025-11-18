// src/redux/actions/departmentActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchEmployeesByDepartment } from "../services/departmentService";

export const loadDepartmentEmployees = createAsyncThunk(
  "department/load",
  async ({ routeDept, limit = 50, offset = 0 }, { getState, rejectWithValue }) => {
    try {
      const token = getState()?.auth?.token || localStorage.getItem("token") || undefined;
      const data = await fetchEmployeesByDepartment({ routeDept, limit, offset, token });

      const items = Array.isArray(data) ? data : data?.items ?? [];
      const total = Array.isArray(data) ? items.length : Number(data?.total ?? items.length);

      return { items, total, routeDept, limit, offset };
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load employees");
    }
  }
);
