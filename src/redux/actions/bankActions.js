// src/redux/actions/bankActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import * as bankService from "../services/bankService";

const err = (e) => e?.message || "Request failed";

// GET by detail_id
export const fetchBankDetailById = createAsyncThunk(
  "bank/fetchById",
  async ({ detailId }, thunkAPI) => {
    try {
      return await bankService.getBankDetail(detailId);
    } catch (e) {
      return thunkAPI.rejectWithValue(err(e));
    }
  },
);

// POST create
export const createBankDetailThunk = createAsyncThunk(
  "bank/create",
  async (
    { employeePk, bank_name, account_number, ifsc_code, branch_name },
    thunkAPI,
  ) => {
    try {
      return await bankService.createBankDetail({
        employee_id: employeePk,
        bank_name,
        account_number,
        ifsc_code,
        branch_name,
      });
    } catch (e) {
      return thunkAPI.rejectWithValue(err(e));
    }
  },
);

// PUT update
export const updateBankDetailThunk = createAsyncThunk(
  "bank/update",
  async (
    { detailId, bank_name, account_number, ifsc_code, branch_name },
    thunkAPI,
  ) => {
    try {
      return await bankService.updateBankDetail(detailId, {
        bank_name,
        account_number,
        ifsc_code,
        branch_name,
      });
    } catch (e) {
      return thunkAPI.rejectWithValue(err(e));
    }
  },
);

// DELETE
export const deleteBankDetailThunk = createAsyncThunk(
  "bank/delete",
  async ({ detailId }, thunkAPI) => {
    try {
      return await bankService.deleteBankDetail(detailId);
    } catch (e) {
      return thunkAPI.rejectWithValue(err(e));
    }
  },
);
