import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import svc from "../services/adminLeave.service";

// Thunks
export const fetchPolicies = createAsyncThunk("policies/fetchAll", async (_, { rejectWithValue }) => {
  try { return await svc.listPolicies(); }
  catch (e) { return rejectWithValue(e?.message || "Failed to fetch policies"); }
});

export const upsertPolicy = createAsyncThunk("policies/upsert", async (data, { rejectWithValue }) => {
  try { return await svc.upsertPolicy(data); }
  catch (e) { return rejectWithValue(e?.message || "Failed to save policy"); }
});

export const deletePolicy = createAsyncThunk("policies/delete", async (id, { rejectWithValue }) => {
  try { await svc.deletePolicy(id); return id; }
  catch (e) { return rejectWithValue(e?.message || "Failed to delete policy"); }
});

export const publishPolicies = createAsyncThunk("policies/publish", async () => {
  return await svc.publishPolicies();
});

// Slice
const slice = createSlice({
  name: "policies",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPolicies.pending,   (s)=>{ s.loading = true; s.error = null; })
     .addCase(fetchPolicies.fulfilled, (s,{payload})=>{ s.loading = false; s.items = payload; })
     .addCase(fetchPolicies.rejected,  (s,{payload})=>{ s.loading = false; s.error = payload; })
     .addCase(upsertPolicy.fulfilled,  (s,{payload})=>{
        const i = s.items.findIndex(x => x.id === payload.id);
        if (i >= 0) s.items[i] = payload; else s.items.unshift(payload);
     })
     .addCase(deletePolicy.fulfilled,  (s,{payload:id})=>{
        s.items = s.items.filter(x => x.id !== id);
     });
  }
});

export default slice.reducer;
