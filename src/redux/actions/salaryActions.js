import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  listSalaries,
  createSalary,
  updateSalary,
  deleteSalary,
} from "../services/salaryService";

const normalizeList = (data) =>
  Array.isArray(data)
    ? data
    : data?.items || data?.results || data?.data || [];

// GET /salaries/
export const fetchSalaries = createAsyncThunk(
  "salary/fetchSalaries",
  async (_, thunkAPI) => {
    try {
      const data = await listSalaries();
      return normalizeList(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to fetch salaries");
    }
  }
);

// POST /salaries/
// { employee_id, base_salary, payroll_policy_id }
export const createSalaryThunk = createAsyncThunk(
  "salary/createSalary",
  async ({ payload }, thunkAPI) => {
    try {
      const data = await createSalary(payload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to create salary");
    }
  }
);

// PUT /salaries/{salaryId}
// payload: { base_salary, payroll_policy_id }
// employee_id is intentionally excluded — backend PUT only accepts base_salary + payroll_policy_id
export const updateSalaryThunk = createAsyncThunk(
  "salary/updateSalary",
  async ({ salaryId, payload }, thunkAPI) => {
    try {
      // Strip employee_id from update payload to match backend PUT schema
      const { employee_id, ...updatePayload } = payload;
      const data = await updateSalary(salaryId, updatePayload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to update salary");
    }
  }
);

// DELETE /salaries/{salaryId}
export const deleteSalaryThunk = createAsyncThunk(
  "salary/deleteSalary",
  async ({ salaryId }, thunkAPI) => {
    try {
      const data = await deleteSalary(salaryId);
      return { salaryId, data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to delete salary");
    }
  }
);