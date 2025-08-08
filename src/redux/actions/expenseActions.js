// src/redux/actions/expenseActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getExpensesService,
  addExpenseService,
  updateExpenseService,
  deleteExpenseService,
} from "../services/expenseService";

// FETCH
export const fetchExpenses = createAsyncThunk(
  "expense/fetchAll",
  async (_, thunkAPI) => {
    try {
      const data = await getExpensesService();
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to fetch expenses");
    }
  }
);

// CREATE
export const createExpense = createAsyncThunk(
  "expense/create",
  async (expense, thunkAPI) => {
    try {
      const data = await addExpenseService(expense);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to create expense");
    }
  }
);

// UPDATE
export const editExpense = createAsyncThunk(
  "expense/update",
  async ({ id, updated }, thunkAPI) => {
    try {
      const data = await updateExpenseService(id, updated);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to update expense");
    }
  }
);

// DELETE
export const removeExpense = createAsyncThunk(
  "expense/delete",
  async (id, thunkAPI) => {
    try {
      await deleteExpenseService(id);
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to delete expense");
    }
  }
);
