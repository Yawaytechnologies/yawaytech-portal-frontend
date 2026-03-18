import { createAsyncThunk } from "@reduxjs/toolkit";
import { shiftTypeService } from "../services/shiftTypeService";

const selectToken = (state) => state?.auth?.token || state?.authSession?.token;

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.detail ||
  err?.response?.data?.message ||
  (typeof err?.response?.data === "string" ? err.response.data : "") ||
  err?.message ||
  fallback;

export const fetchShiftTypes = createAsyncThunk(
  "shiftType/fetchShiftTypes",
  async (_params = {}, { rejectWithValue }) => {
    void _params;
    try {
      return await shiftTypeService.getAllShifts();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load shifts"));
    }
  },
);

export const addShiftType = createAsyncThunk(
  "shiftType/addShiftType",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const token = selectToken(getState());
      return await shiftTypeService.createShift(payload, token);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to create shift"));
    }
  },
);

export const assignShiftToEmployee = createAsyncThunk(
  "shiftType/assignShiftToEmployee",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const token = selectToken(getState());

      const apiPayload = {
        employee_id: String(payload.employee_id),
        shift_id: Number(payload.shift_id),
        effective_from: payload.effective_from,
        effective_to: payload.effective_to,
      };

      return await shiftTypeService.assignShift(apiPayload, token);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to assign shift"));
    }
  },
);

export const fetchDepartmentEmployees = createAsyncThunk(
  "shiftType/fetchDepartmentEmployees",
  async (department, { getState, rejectWithValue }) => {
    try {
      const token = selectToken(getState());
      return await shiftTypeService.getEmployeesByDepartment(department, token);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load employees"));
    }
  },
);
