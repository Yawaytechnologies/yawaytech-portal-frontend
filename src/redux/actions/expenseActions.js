import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getExpensesService,
  addExpenseService,
  updateExpenseService,
  deleteExpenseService,
} from '../services/expenseService';

// 1. Fetch all expenses
export const fetchExpenses = createAsyncThunk(
  'expense/fetchExpenses',
  async (_, thunkAPI) => {
    try {
      const data = await getExpensesService();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Failed to fetch expenses');
    }
  }
);

// 2. Add expense
export const createExpense = createAsyncThunk(
  'expense/createExpense',
  async (expense, thunkAPI) => {
    try {
      const data = await addExpenseService(expense);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Failed to add expense');
    }
  }
);

// 3. Update expense
export const editExpense = createAsyncThunk(
  'expense/editExpense',
  async ({ id, updatedData }, thunkAPI) => {
    try {
      const data = await updateExpenseService(id, updatedData);
      return { id, data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Failed to update expense');
    }
  }
);

// 4. Delete expense
export const removeExpense = createAsyncThunk(
  'expense/removeExpense',
  async (id, thunkAPI) => {
    try {
      await deleteExpenseService(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Failed to delete expense');
    }
  }
);
