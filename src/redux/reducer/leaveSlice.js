// src/redux/reducer/leaveSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchLeaveTypes,
  applyLeave,
  fetchEmployeeLeaves,
  fetchLeaveRequests,
  fetchLeaveBalances,
  fetchLeaveSummary,
} from "../actions/leaveActions";

const initialState = {
  requests: [],
  requestsStatus: "idle",
  requestsError: null,

  types: [],
  typesStatus: "idle",
  typesError: null,

  applyStatus: "idle",
  applyError: null,
  lastApplied: null,

  employeeLeaves: [],
  employeeLeavesStatus: "idle",
  employeeLeavesError: null,

  // ── NEW ──
  balances: [],
  balancesStatus: "idle",
  balancesError: null,

  summary: null,
  summaryStatus: "idle",
  summaryError: null,
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
    clearRequests(state) {
      state.requests = [];
      state.requestsStatus = "idle";
      state.requestsError = null;
    },
  },
  extraReducers: (builder) => {
    // Leave types
    builder
      .addCase(fetchLeaveTypes.pending, (state) => { state.typesStatus = "loading"; state.typesError = null; })
      .addCase(fetchLeaveTypes.fulfilled, (state, action) => { state.typesStatus = "succeeded"; state.types = action.payload || []; })
      .addCase(fetchLeaveTypes.rejected, (state, action) => { state.typesStatus = "failed"; state.typesError = action.payload || "Error"; });

    // Apply leave
    builder
      .addCase(applyLeave.pending, (state) => { state.applyStatus = "loading"; state.applyError = null; state.lastApplied = null; })
      .addCase(applyLeave.fulfilled, (state, action) => { state.applyStatus = "succeeded"; state.lastApplied = action.payload || null; })
      .addCase(applyLeave.rejected, (state, action) => { state.applyStatus = "failed"; state.applyError = action.payload || null; });

    // Employee leave history
    builder
      .addCase(fetchEmployeeLeaves.pending, (state) => { state.employeeLeavesStatus = "loading"; })
      .addCase(fetchEmployeeLeaves.fulfilled, (state, action) => { state.employeeLeavesStatus = "succeeded"; state.employeeLeaves = action.payload || []; })
      .addCase(fetchEmployeeLeaves.rejected, (state, action) => { state.employeeLeavesStatus = "failed"; state.employeeLeavesError = action.payload || null; });

    // Leave requests
    builder
      .addCase(fetchLeaveRequests.pending, (state) => { state.requestsStatus = "loading"; state.requestsError = null; })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => { state.requestsStatus = "succeeded"; state.requests = action.payload || []; })
      .addCase(fetchLeaveRequests.rejected, (state, action) => { state.requestsStatus = "failed"; state.requestsError = action.payload || null; });

    // ── NEW: Balances ──
    builder
      .addCase(fetchLeaveBalances.pending, (state) => { state.balancesStatus = "loading"; state.balancesError = null; })
      .addCase(fetchLeaveBalances.fulfilled, (state, action) => { state.balancesStatus = "succeeded"; state.balances = action.payload || []; })
      .addCase(fetchLeaveBalances.rejected, (state, action) => { state.balancesStatus = "failed"; state.balancesError = action.payload || null; });

    // ── NEW: Summary ──
    builder
      .addCase(fetchLeaveSummary.pending, (state) => { state.summaryStatus = "loading"; state.summaryError = null; })
      .addCase(fetchLeaveSummary.fulfilled, (state, action) => { state.summaryStatus = "succeeded"; state.summary = action.payload || null; })
      .addCase(fetchLeaveSummary.rejected, (state, action) => { state.summaryStatus = "failed"; state.summaryError = action.payload || null; });
  },
});

export const { resetApplyState, clearEmployeeLeaves, clearRequests } = leaveSlice.actions;
export default leaveSlice.reducer;