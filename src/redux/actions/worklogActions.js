// src/redux/actions/worklogActions.js
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
  }
);

// ✅ only employeeId; service returns ALL worklogs
export const fetchWorklogsByEmployee = createAsyncThunk(
  "worklog/fetchByEmployee",
  async ({ employeeId }, { rejectWithValue }) => {
    try {
      return await WorklogService.listByEmployee(employeeId);
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const checkInWorklog = createAsyncThunk(
  "worklog/checkIn",
  async ({ worklogId, at }, { rejectWithValue }) => {
    try {
      return await WorklogService.checkIn(worklogId, at);
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const checkOutWorklog = createAsyncThunk(
  "worklog/checkOut",
  async ({ worklogId, at }, { rejectWithValue }) => {
    try {
      return await WorklogService.checkOut(worklogId, at);
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const patchWorklog = createAsyncThunk(
  "worklog/patch",
  async ({ worklogId, patch }, { rejectWithValue }) => {
    try {
      return await WorklogService.patch(worklogId, patch);
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);
