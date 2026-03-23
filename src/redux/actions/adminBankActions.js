// src/redux/actions/adminBankActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  listBankDetails,
  getBankDetail,
  createBankDetail,
  updateBankDetail,
  deleteBankDetail,
} from "../services/adminBankService";

const err = (e) => e?.message || "Request failed";

/* ── LIST all ── */
export const adminListBankDetails = createAsyncThunk(
  "adminBank/list",
  async (_, thunkAPI) => {
    try {
      const data = await listBankDetails();
      return Array.isArray(data) ? data : data?.items || data?.data || [];
    } catch (e) {
      return thunkAPI.rejectWithValue(err(e));
    }
  },
);

/* ── GET by employee_id ── */
export const adminFetchBankDetail = createAsyncThunk(
  "adminBank/fetch",
  async ({ employeeId }, thunkAPI) => {
    try {
      return await getBankDetail(employeeId);
    } catch (e) {
      return thunkAPI.rejectWithValue(err(e));
    }
  },
);

/* ── POST create ── */
export const adminCreateBankDetail = createAsyncThunk(
  "adminBank/create",
  async ({ payload }, thunkAPI) => {
    try {
      return await createBankDetail(payload);
    } catch (e) {
      return thunkAPI.rejectWithValue(err(e));
    }
  },
);

/* ── PUT update ── */
export const adminUpdateBankDetail = createAsyncThunk(
  "adminBank/update",
  async ({ employeeId, payload }, thunkAPI) => {
    try {
      return await updateBankDetail(employeeId, payload);
    } catch (e) {
      return thunkAPI.rejectWithValue(err(e));
    }
  },
);

/* ── DELETE ── */
export const adminDeleteBankDetail = createAsyncThunk(
  "adminBank/delete",
  async ({ employeeId }, thunkAPI) => {
    try {
      await deleteBankDetail(employeeId);
      return { employeeId };
    } catch (e) {
      return thunkAPI.rejectWithValue(err(e));
    }
  },
);
