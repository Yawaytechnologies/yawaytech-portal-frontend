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

// ✅ only worklogId (Swagger has no body)
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

export const patchWorklog = createAsyncThunk(
  "worklog/patch",
  async ({ worklogId, patch }, { rejectWithValue }) => {
    try {
      return await WorklogService.patch(worklogId, patch);
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);
