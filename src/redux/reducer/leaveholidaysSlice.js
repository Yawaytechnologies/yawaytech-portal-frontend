import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import svc from "../services/adminLeave.service";

// Thunks
export const fetchHolidays = createAsyncThunk(
  "holidays/fetchAll",
  async (year, { rejectWithValue }) => {
    try {
      return { year, rows: await svc.listHolidays(year) };
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to fetch holidays");
    }
  }
);

export const upsertHoliday = createAsyncThunk(
  "holidays/upsert",
  async (data, { rejectWithValue }) => {
    try {
      // force all holidays as paid/company holidays
      return await svc.upsertHoliday({ ...data, is_paid: true });
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to save holiday");
    }
  }
);

export const deleteHoliday = createAsyncThunk(
  "holidays/delete",
  async (id, { rejectWithValue }) => {
    try {
      await svc.deleteHoliday(id);
      return id;
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to delete holiday");
    }
  }
);

export const importHolidays = createAsyncThunk(
  "holidays/import",
  async (list, { rejectWithValue }) => {
    try {
      // force imported holidays also as paid/company holidays
      const normalized = Array.isArray(list)
        ? list.map((row) => ({ ...row, is_paid: true }))
        : [];
      return await svc.importHolidays(normalized);
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to import holidays");
    }
  }
);

export const publishHolidays = createAsyncThunk(
  "holidays/publish",
  async (year) => {
    return await svc.publishHolidays(year);
  }
);

// Slice
const slice = createSlice({
  name: "holidays",
  initialState: {
    year: String(new Date().getFullYear()),
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    setYear(state, { payload }) {
      state.year = payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchHolidays.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(fetchHolidays.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.year = payload.year;
        s.items = payload.rows;
      })
      .addCase(fetchHolidays.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload;
      })
      .addCase(upsertHoliday.fulfilled, (s, { payload }) => {
        const i = s.items.findIndex((x) => x.id === payload.id);
        if (i >= 0) s.items[i] = payload;
        else s.items.unshift(payload);
      })
      .addCase(deleteHoliday.fulfilled, (s, { payload: id }) => {
        s.items = s.items.filter((x) => x.id !== id);
      })
      .addCase(importHolidays.fulfilled, (s, { payload }) => {
        s.items = [...payload, ...s.items];
      });
  },
});

export const { setYear } = slice.actions;
export default slice.reducer;