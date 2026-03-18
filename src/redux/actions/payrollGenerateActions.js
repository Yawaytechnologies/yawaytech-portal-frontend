import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchPayrollListService,
  fetchEmployeePayrollDetailService,
} from "../services/payrollGenerateService";

export const fetchPayrollListThunk = createAsyncThunk(
  "payrollGenerate/fetchPayrollList",
  async ({ monthStart }, thunkAPI) => {
    try {
      console.log("THUNK START: fetchPayrollListThunk", { monthStart });

      const data = await fetchPayrollListService(monthStart, thunkAPI.getState);

      console.log("THUNK SUCCESS: fetchPayrollListThunk", data);

      return { monthStart, data };
    } catch (error) {
      const msg =
        error?.code === "ECONNABORTED"
          ? "Payroll list request timed out."
          : error?.response?.data?.detail ||
            error?.response?.data?.message ||
            error?.message ||
            "Failed to fetch payroll list";

      console.log("THUNK FAILED: fetchPayrollListThunk", msg);

      return thunkAPI.rejectWithValue(msg);
    }
  },
);

export const fetchEmployeePayrollDetailThunk = createAsyncThunk(
  "payrollGenerate/fetchEmployeePayrollDetail",
  async ({ employeeId, monthStart }, thunkAPI) => {
    try {
      console.log("THUNK START: fetchEmployeePayrollDetailThunk", {
        employeeId,
        monthStart,
      });

      const data = await fetchEmployeePayrollDetailService(
        employeeId,
        monthStart,
        thunkAPI.getState,
      );

      console.log("THUNK SUCCESS: fetchEmployeePayrollDetailThunk", data);

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

      console.log("THUNK FAILED: fetchEmployeePayrollDetailThunk", msg);

      return thunkAPI.rejectWithValue(msg);
    }
  },
);
