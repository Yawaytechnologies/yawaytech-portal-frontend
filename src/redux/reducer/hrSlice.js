import { createSlice } from "@reduxjs/toolkit";
import { fetchHREmployees } from "../actions/hrActions";

const hrSlice = createSlice({
  name: "hr",
  initialState: {
    employees: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHREmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHREmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload || [];
      })
      .addCase(fetchHREmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch employees";
      });
  },
});

export const hrReducer = hrSlice.reducer;
