import { createAsyncThunk } from "@reduxjs/toolkit";
import WorklogService from "../services/worklogService";

export const createWorklog = createAsyncThunk(
  "worklog/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await WorklogService.create(payload);
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

export const fetchWorklogsByEmployee = createAsyncThunk(
  "worklog/fetchByEmployee",
  async ({ employeeId }, { rejectWithValue }) => {
    try {
      return await WorklogService.listByEmployee(employeeId);
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

export const checkInWorklog = createAsyncThunk(
  "worklog/checkIn",
  async ({ worklogId }, { rejectWithValue }) => {
    try {
      return await WorklogService.checkIn(worklogId);
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

export const checkOutWorklog = createAsyncThunk(
  "worklog/checkOut",
  async ({ worklogId }, { rejectWithValue }) => {
    try {
      return await WorklogService.checkOut(worklogId);
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

// ✅ Edit fields
export const updateWorklog = createAsyncThunk(
  "worklog/update",
  async ({ worklogId, payload }, { rejectWithValue }) => {
    try {
      return await WorklogService.update(worklogId, payload);
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

// ✅ Edit times
export const updateWorklogTimes = createAsyncThunk(
  "worklog/updateTimes",
  async ({ worklogId, start_time, end_time }, { rejectWithValue }) => {
    try {
      return await WorklogService.updateTimes(worklogId, start_time, end_time);
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

// ✅ Delete
export const deleteWorklog = createAsyncThunk(
  "worklog/delete",
  async ({ worklogId }, { rejectWithValue }) => {
    try {
      await WorklogService.remove(worklogId);
      return worklogId;
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);
