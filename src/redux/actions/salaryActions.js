// src/redux/actions/salaryActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  listSalaries,
  createSalary,
  updateSalary,
  deleteSalary,
} from "../services/salaryService";

const normalizeList = (data) => (Array.isArray(data) ? data : data?.items || data?.results || []);

export const fetchSalaries = createAsyncThunk(
  "salary/fetchSalaries",
  async (_, thunkAPI) => {
    try {
      const data = await listSalaries();
      return normalizeList(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to fetch salaries");
    }
  },
);

export const createSalaryThunk = createAsyncThunk(
  "salary/createSalary",
  async ({ payload }, thunkAPI) => {
    try {
      const data = await createSalary(payload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to create salary");
    }
  },
);

export const updateSalaryThunk = createAsyncThunk(
  "salary/updateSalary",
  async ({ salaryId, payload }, thunkAPI) => {
    try {
      const data = await updateSalary(salaryId, payload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to update salary");
    }
  },
);

export const deleteSalaryThunk = createAsyncThunk(
  "salary/deleteSalary",
  async ({ salaryId }, thunkAPI) => {
    try {
      const data = await deleteSalary(salaryId);
      return { salaryId, data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to delete salary");
    }
  },
);