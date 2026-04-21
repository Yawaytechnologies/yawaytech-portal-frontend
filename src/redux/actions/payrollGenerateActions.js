import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchPayrollListService,
  fetchEmployeePayrollDetailService,
} from "../services/payrollGenerateService";

export const fetchPayrollListThunk = createAsyncThunk(
  "payrollGenerate/fetchPayrollList",
  async ({ monthStart }, thunkAPI) => {
    try {
      const data = await fetchPayrollListService(monthStart, thunkAPI.getState);

      return { monthStart, data };
    } catch (error) {
      const msg =
        error?.code === "ECONNABORTED"
          ? "Payroll list request timed out."
          : error?.response?.data?.detail ||
            error?.response?.data?.message ||
            error?.message ||
            "Failed to fetch payroll list";

      return thunkAPI.rejectWithValue(msg);
    }
  },
);

export const fetchEmployeePayrollDetailThunk = createAsyncThunk(
  "payrollGenerate/fetchEmployeePayrollDetail",
  async ({ employeeId, monthStart }, thunkAPI) => {
    try {
      const data = await fetchEmployeePayrollDetailService(
        employeeId,
        monthStart,
        thunkAPI.getState,
      );

      return {
        employeeId: String(employeeId),
        monthStart,
        data,
      };
    } catch (error) {
      const msg =
        error?.code === "ECONNABORTED"
          ? "Employee payroll detail request timed out."
          : error?.response?.data?.detail ||
            error?.response?.data?.message ||
            error?.message ||
            "Failed to fetch employee payroll detail";

      return thunkAPI.rejectWithValue(msg);
    }
  },
);
