// src/redux/reducer/worklogSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { resetWorklog, setWorklogFilters, fetchWorklogsByEmployee } from "../actions/worklogActions";

const initialState = {
  items: [],        // ← raw backend rows live here
  total: 0,
  loading: false,
  error: "",
  filters: { employeeId: "", from: "", to: "" },
};

const slice = createSlice({
  name: "worklog",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(resetWorklog, () => initialState);
    b.addCase(setWorklogFilters, (s,a)=>{ s.filters = { ...s.filters, ...a.payload }; });

    b.addCase(fetchWorklogsByEmployee.pending, (s,a)=>{
      s.loading = true; s.error = "";
      s.filters = { ...s.filters, ...(a.meta?.arg || {}) };
    });
    b.addCase(fetchWorklogsByEmployee.fulfilled, (s,a)=>{
      s.loading = false;
      s.items = a.payload.items;                 // ← no mapping
      s.total = a.payload.total ?? s.items.length;
    });
    b.addCase(fetchWorklogsByEmployee.rejected, (s,a)=>{
      s.loading = false;
      s.error = a.payload || a.error?.message || "Failed to fetch worklogs";
    });
  }
});

export default slice.reducer;

export const selectWorklogItems   = (s)=> s.worklog?.items || [];
export const selectWorklogTotal   = (s)=> s.worklog?.total || 0;
export const selectWorklogLoading = (s)=> s.worklog?.loading || false;
export const selectWorklogError   = (s)=> s.worklog?.error || "";
export const selectWorklogFilters = (s)=> s.worklog?.filters || initialState.filters;
