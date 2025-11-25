// src/redux/reducer/leaverequestsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AdminLeaveService from "../services/adminLeave.service";

/* ----------------------------- Thunks ----------------------------- */

// Load list of requests
export const fetchRequests = createAsyncThunk(
  "requests/fetch",
  async (params, { getState, rejectWithValue }) => {
    try {
      // merge with existing params so we don't lose anything
      const stateParams = getState().requests?.params || {};
      const effectiveParams = { ...stateParams, ...(params || {}) };
      const data = await AdminLeaveService.listRequests(
        effectiveParams
      );
      return { data, params: effectiveParams };
    } catch (err) {
      return rejectWithValue(
        err.message || "Failed to load requests"
      );
    }
  }
);

export const decideRequest = createAsyncThunk(
  "requests/decide",
  async ({ id, action, note }, { getState, rejectWithValue }) => {
    try {
      const state = getState();

      const approverEmployeeId =
        state.auth?.user?.employee_id ||
        state.auth?.user?.employeeId ||
        state.profile?.employee_id ||
        "YTPL001HR"; // fallback

      const res = await AdminLeaveService.decideRequest(
        id,
        action,
        note,
        approverEmployeeId
      );

      return {
        id: res.id ?? id,
        status: res.status,
        note: res.note ?? note ?? "",
      };
    } catch (err) {
      console.error("decideRequest error:", err);
      return rejectWithValue(
        err.message || "Failed to update request"
      );
    }
  }
);

/* ------------------------------ Slice ----------------------------- */

const initialState = {
  items: [],
  params: {
    q: "",
    type: "All",
    status: "Pending", // UI label; service maps to PENDING
  },
  loading: false,
  error: null,
};

const requestsSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    setParams(state, action) {
      state.params = { ...state.params, ...action.payload };
    },
    clearRequests(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRequests
      .addCase(fetchRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.params = {
          ...state.params,
          ...action.payload.params,
        };
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to load requests";
      })

      // decideRequest – update row locally
      .addCase(decideRequest.fulfilled, (state, action) => {
        const { id, status, note } = action.payload;
        const row = state.items.find(
          (r) => String(r.id) === String(id)
        );
        if (row) {
          row.status = status;
          row.note = note;
        }
      });
  },
});

export const { setParams, clearRequests } = requestsSlice.actions;
export default requestsSlice.reducer;
