// src/redux/reducer/departmentSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { loadDepartmentEmployees } from "../actions/departmentActions";

const initialState = {
  routeDept: null,
  items: [],
  total: 0,
  loading: false,
  error: null,
  limit: 50,
  offset: 0,
};

const departmentSlice = createSlice({
  name: "department",
  initialState,
  reducers: {
    resetDepartment(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDepartmentEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDepartmentEmployees.fulfilled, (state, action) => {
        const { items, total, routeDept, limit, offset } = action.payload;
        state.loading = false;
        state.items = items;
        state.total = total;
        state.routeDept = routeDept;
        state.limit = limit;
        state.offset = offset;
      })
      .addCase(loadDepartmentEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load employees";
      });
  },
});

export const { resetDepartment } = departmentSlice.actions;
export default departmentSlice.reducer;
