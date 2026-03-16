// src/redux/actions/payrollPolicyActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from "../services/payrollPolicyService";

const normList = (data) => (Array.isArray(data) ? data : data?.items || data?.results || []);

export const fetchPayrollPolicies = createAsyncThunk(
  "payrollPolicies/fetchAll",
  async (_, thunkAPI) => {
    try {
      const data = await listPolicies();
      return normList(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to load policies");
    }
  },
);

export const fetchPayrollPolicyById = createAsyncThunk(
  "payrollPolicies/fetchById",
  async ({ policyId }, thunkAPI) => {
    try {
      const data = await getPolicy(policyId);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to load policy");
    }
  },
);

export const createPayrollPolicyThunk = createAsyncThunk(
  "payrollPolicies/create",
  async ({ payload }, thunkAPI) => {
    try {
      const data = await createPolicy(payload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to create policy");
    }
  },
);

export const updatePayrollPolicyThunk = createAsyncThunk(
  "payrollPolicies/update",
  async ({ policyId, payload }, thunkAPI) => {
    try {
      const data = await updatePolicy(policyId, payload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to update policy");
    }
  },
);

export const deletePayrollPolicyThunk = createAsyncThunk(
  "payrollPolicies/delete",
  async ({ policyId }, thunkAPI) => {
    try {
      const data = await deletePolicy(policyId);
      return { policyId, data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to delete policy");
    }
  },
);