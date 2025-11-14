// src/redux/reducer/departmentOverviewSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchDepartmentEmployeeById, DEPARTMENT_DETAIL_RESET } from "../actions/departmentOverviewAction";

const initialState = {
  selectedEmployee: null,
  loading: false,
  error: null,
};

const departmentOverviewSlice = createSlice({
  name: "departmentOverview",
  initialState,
  reducers: {
    departmentDetailReset(state) {
      state.selectedEmployee = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartmentEmployeeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentEmployeeById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEmployee = action.payload || null;
      })
      .addCase(fetchDepartmentEmployeeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load";
      })
      // Support legacy reset dispatch({ type: DEPARTMENT_DETAIL_RESET })
      .addCase(DEPARTMENT_DETAIL_RESET, (state) => {
        state.selectedEmployee = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { departmentDetailReset } = departmentOverviewSlice.actions;
export default departmentOverviewSlice.reducer;
