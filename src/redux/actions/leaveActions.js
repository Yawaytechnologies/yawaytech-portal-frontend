// src/redux/actions/leaveActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchLeaveTypesApi,
  applyLeaveApi,
  fetchEmployeeLeavesApi,
  fetchLeaveRequestsApi,
  fetchLeaveBalancesApi,
  fetchLeaveSummaryApi,
  cancelLeaveApi,
} from "../services/leaveService";

export const fetchLeaveRequests = createAsyncThunk(
  "employeeLeave/fetchLeaveRequests",
  async ({ employeeId, status }, { rejectWithValue }) => {
    try {
      return await fetchLeaveRequestsApi(employeeId, { status });
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch leave requests");
    }
  }
);

export const fetchLeaveTypes = createAsyncThunk(
  "leaveTypes/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchLeaveTypesApi();
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load leave types");
    }
  }
);

export const applyLeave = createAsyncThunk(
  "employeeLeave/apply",
  async ({ employeeId, rec }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const leaveTypes = state.employeeLeave?.types || state.leave?.types || [];
      return await applyLeaveApi(employeeId, rec, leaveTypes);
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to apply leave");
    }
  }
);

export const fetchEmployeeLeaves = createAsyncThunk(
  "employeeLeave/fetchEmployeeLeaves",
  async ({ employeeId, from, to }, { rejectWithValue }) => {
    try {
      return await fetchEmployeeLeavesApi(employeeId, { from, to });
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch leave history");
    }
  }
);

// ── NEW: GET /api/leave/balances ──────────────────────────────────────────────
export const fetchLeaveBalances = createAsyncThunk(
  "employeeLeave/fetchBalances",
  async ({ employeeId, year, month }, { rejectWithValue }) => {
    try {
      return await fetchLeaveBalancesApi(employeeId, { year, month });
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch leave balances");
    }
  }
);

// ── NEW: GET /api/leave/summary ───────────────────────────────────────────────
export const fetchLeaveSummary = createAsyncThunk(
  "employeeLeave/fetchSummary",
  async ({ employeeId, year, month }, { rejectWithValue }) => {
    try {
      return await fetchLeaveSummaryApi(employeeId, { year, month });
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch leave summary");
    }
  }
);

// ── NEW: POST /api/leave/{leaveId}/cancel ──────────────────────────────────────
export const cancelLeave = createAsyncThunk(
  "employeeLeave/cancel",
  async ({ leaveId, employeeId }, { rejectWithValue }) => {
    try {
      return await cancelLeaveApi(leaveId, employeeId);
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to cancel leave");
    }
  }
);