// src/redux/actions/leaveActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchLeaveTypesApi,
  applyLeaveApi,
  fetchEmployeeLeavesApi,
  fetchLeaveRequestsApi,
} from "../services/leaveService";

export const fetchLeaveRequests = createAsyncThunk(
  "employeeLeave/fetchLeaveRequests",
  async ({ employeeId, status }, { rejectWithValue }) => {
    try {
      const data = await fetchLeaveRequestsApi(employeeId, { status });
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch leave requests");
    }
  }
);

/**
 * GET /api/leave/types
 */
export const fetchLeaveTypes = createAsyncThunk(
  "leaveTypes/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchLeaveTypesApi(); // <- returns plain array
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load leave types");
    }
  }
);

/**
 * POST /api/leave/apply
 *
 * payload: { employeeId, rec }
 * `rec` is the object emitted from <LeaveForm /> onSubmit.
 */
export const applyLeave = createAsyncThunk(
  "employeeLeave/apply",
  async ({ employeeId, rec }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const leaveTypes = state.Leave?.types || [];
      const data = await applyLeaveApi(employeeId, rec, leaveTypes);
      return data;
    } catch (err) {
      const msg = err?.message || "Failed to apply leave";
      return rejectWithValue(msg);
    }
  }
);

/**
 * GET /api/leave/employee?employeeId=&from=&to=
 * Used by "Status" tab; not used by the Apply form itself.
 */
export const fetchEmployeeLeaves = createAsyncThunk(
  "employeeLeave/fetchEmployeeLeaves",
  async ({ employeeId, from, to }, { rejectWithValue }) => {
    try {
      const data = await fetchEmployeeLeavesApi(employeeId, { from, to });
      return data;
    } catch (err) {
      const msg = err?.message || "Failed to fetch leave history";
      return rejectWithValue(msg);
    }
  }
);
