// src/redux/slices/newEmployeeSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { createEmployee } from "../actions/newEmployeeAction";

const initialState = {
  creating: "idle",     // 'idle' | 'pending' | 'succeeded' | 'failed'
  createError: null,
  lastCreated: null,
};

const newEmployeeSlice = createSlice({
  name: "newEmployees",
  initialState,
  reducers: {
    resetCreateState(state) {
      state.creating = "idle";
      state.createError = null;
      state.lastCreated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createEmployee.pending, (state) => {
        state.creating = "pending";
        state.createError = null;
        state.lastCreated = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.creating = "succeeded";
        state.createError = null;
        state.lastCreated = action.payload ?? true;
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.creating = "failed";
        state.createError = action.payload || "Create failed";
        state.lastCreated = null;
      });
  },
});

export const { resetCreateState } = newEmployeeSlice.actions;
export default newEmployeeSlice.reducer;
