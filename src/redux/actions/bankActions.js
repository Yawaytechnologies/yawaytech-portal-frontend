import { createAsyncThunk } from "@reduxjs/toolkit";
import * as bankService from "../services/bankService";

const err = (e) => e?.message || "Request failed";

// GET
export const fetchBankDetailById = createAsyncThunk(
  "bank/fetchById",
  async ({ employeeId }, thunkAPI) => {
    try {
      return await bankService.getBankDetail(employeeId);
    } catch (e) {
      return thunkAPI.rejectWithValue(err(e));
    }
  },
);

// POST create  ← ADD THIS BACK
// Line — employeeCode → employee_id
export const createBankDetailThunk = createAsyncThunk(
  "bank/create",
  async (
    { employeeCode, bank_name, account_number, ifsc_code, branch_name },
    thunkAPI,
  ) => {
    try {
      return await bankService.createBankDetail({
        employee_id: employeeCode, // ← passes YTPL509IT
        bank_name,
        account_number,
        ifsc_code,
        branch_name,
      });
    } catch (e) {
      return thunkAPI.rejectWithValue(e?.message || "Request failed");
    }
  },
);
