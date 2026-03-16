import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPayrollListThunk,
  fetchEmployeePayrollDetailThunk,
} from "../actions/payrollGenerateActions";

const initialState = {
  rows: [],
  monthStart: "",
  loadingList: false,
  listError: null,

  detailByKey: {},
  loadingDetailById: {},
  detailError: null,
};

const payrollGenerateSlice = createSlice({
  name: "payrollGenerate",
  initialState,
  reducers: {
    clearPayrollGenerateError(state) {
      state.listError = null;
      state.detailError = null;
    },
    clearPayrollGenerateRows(state) {
      state.rows = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollListThunk.pending, (state) => {
        state.loadingList = true;
        state.listError = null;
      })
      .addCase(fetchPayrollListThunk.fulfilled, (state, action) => {
        state.loadingList = false;
        state.rows = action.payload.data || [];
        state.monthStart = action.payload.monthStart || "";
      })
      .addCase(fetchPayrollListThunk.rejected, (state, action) => {
        state.loadingList = false;
        state.rows = [];
        state.listError = action.payload || "Failed to fetch payroll list";
      })

      .addCase(fetchEmployeePayrollDetailThunk.pending, (state, action) => {
        const employeeId = String(action.meta.arg.employeeId);
        state.loadingDetailById[employeeId] = true;
        state.detailError = null;
      })
      .addCase(fetchEmployeePayrollDetailThunk.fulfilled, (state, action) => {
        const { employeeId, monthStart, data } = action.payload;
        const key = `${employeeId}-${monthStart}`;
        state.loadingDetailById[employeeId] = false;
        state.detailByKey[key] = data;
      })
      .addCase(fetchEmployeePayrollDetailThunk.rejected, (state, action) => {
        const employeeId = String(action.meta.arg.employeeId);
        state.loadingDetailById[employeeId] = false;
        state.detailError =
          action.payload || "Failed to fetch employee payroll detail";
      });
  },
});

export const { clearPayrollGenerateError, clearPayrollGenerateRows } =
  payrollGenerateSlice.actions;

export const selectPayrollRows = (state) => state.payrollGenerate.rows;
export const selectPayrollMonthStart = (state) =>
  state.payrollGenerate.monthStart;
export const selectPayrollListLoading = (state) =>
  state.payrollGenerate.loadingList;
export const selectPayrollListError = (state) =>
  state.payrollGenerate.listError;
export const selectPayrollDetailError = (state) =>
  state.payrollGenerate.detailError;
export const selectPayrollDetailByKey = (state, employeeId, monthStart) =>
  state.payrollGenerate.detailByKey[`${employeeId}-${monthStart}`];
export const selectPayrollDetailLoadingById = (state, employeeId) =>
  !!state.payrollGenerate.loadingDetailById[String(employeeId)];

export default payrollGenerateSlice.reducer;
