// src/redux/slices/leaveSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchLeaveTypes,
  applyLeave,
  fetchEmployeeLeaves,
} from "../actions/leaveActions";

const initialState = {
  // GET /api/leave/types
  types: [],
  typesStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  typesError: null,

  // POST /api/leave/apply
  applyStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  applyError: null,
  lastApplied: null, // raw API response object

  // GET /api/leave/employee
  employeeLeaves: [],
  employeeLeavesStatus: "idle",
  employeeLeavesError: null,
};

const leaveSlice = createSlice({
  name: "employeeLeave",
  initialState,
  reducers: {
    resetApplyState(state) {
      state.applyStatus = "idle";
      state.applyError = null;
      state.lastApplied = null;
    },
    clearEmployeeLeaves(state) {
      state.employeeLeaves = [];
      state.employeeLeavesStatus = "idle";
      state.employeeLeavesError = null;
    },
  },
  extraReducers: (builder) => {
  /* -------- Leave types -------- */
builder
  .addCase(fetchLeaveTypes.pending, (state) => {
    state.typesStatus = "loading";
    state.typesError = null;
  })
  .addCase(fetchLeaveTypes.fulfilled, (state, action) => {
    state.typesStatus = "succeeded";
    state.typesError = null;
    state.types = action.payload || [];   // ⬅️ this is the array you pass to LeaveForm
  })
  .addCase(fetchLeaveTypes.rejected, (state, action) => {
    state.typesStatus = "failed";
    state.typesError =
      action.payload || action.error?.message || "Error";
  });


    /* -------- Apply leave -------- */
    builder
      .addCase(applyLeave.pending, (state) => {
        state.applyStatus = "loading";
        state.applyError = null;
        state.lastApplied = null;
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.applyStatus = "succeeded";
        state.applyError = null;
        state.lastApplied = action.payload || null;
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.applyStatus = "failed";
        state.applyError = action.payload || action.error.message || null;
      });

    /* -------- Employee leave history -------- */
    builder
      .addCase(fetchEmployeeLeaves.pending, (state) => {
        state.employeeLeavesStatus = "loading";
        state.employeeLeavesError = null;
      })
      .addCase(fetchEmployeeLeaves.fulfilled, (state, action) => {
        state.employeeLeavesStatus = "succeeded";
        state.employeeLeavesError = null;
        // already mapped to UI shape in service
        state.employeeLeaves = action.payload || [];
      })
      .addCase(fetchEmployeeLeaves.rejected, (state, action) => {
        state.employeeLeavesStatus = "failed";
        state.employeeLeavesError =
          action.payload || action.error.message || null;
      });
  },
});

export const { resetApplyState, clearEmployeeLeaves } = leaveSlice.actions;
export default leaveSlice.reducer;
