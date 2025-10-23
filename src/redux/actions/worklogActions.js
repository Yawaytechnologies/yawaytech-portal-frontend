// src/redux/actions/worklogActions.js
import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { getEmployeeWorklogs } from "../services/worklogService";

export const resetWorklog = createAction("worklog/reset");
export const setWorklogFilters = createAction("worklog/setFilters", (p)=>({payload:p}));

export const fetchWorklogsByEmployee = createAsyncThunk(
  "worklog/fetchByEmployee",
  async ({ employeeId, from, to }, { rejectWithValue }) => {
    try {
      const { items, total } = await getEmployeeWorklogs({ employeeId, from, to });
      // ⬇️ return backend rows AS-IS (snake_case intact)
      return { items, total, meta: { employeeId, from, to } };
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch worklogs");
    }
  }
);
