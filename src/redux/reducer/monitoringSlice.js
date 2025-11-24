// src/redux/reducer/monitoringSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchMonitoring } from "../actions/monitoringActions";

const initialState = {
  employeeId: "",
  limit: 100,
  since: "",
  until: "",

  data: null, // { employee_id, employee_name, items: [...] }
  status: "idle", // "idle" | "loading" | "succeeded" | "failed"
  error: null,
};

const slice = createSlice({
  name: "monitoring",
  initialState,
  reducers: {
    setEmployeeId: (s, a) => {
      s.employeeId = a.payload;
    },
    setLimit: (s, a) => {
      s.limit = a.payload;
    },
    setSince: (s, a) => {
      s.since = a.payload;
    },
    setUntil: (s, a) => {
      s.until = a.payload;
    },
    clearData: (s) => {
      s.data = null;
      s.status = "idle";
      s.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMonitoring.pending, (s) => {
      s.status = "loading";
      s.error = null;
    });
    b.addCase(fetchMonitoring.fulfilled, (s, a) => {
      s.status = "succeeded";
      s.data = a.payload;
    });
    b.addCase(fetchMonitoring.rejected, (s, a) => {
      s.status = "failed";
      s.error = a.payload || "Failed to load monitoring";
    });
  },
});

export const { setEmployeeId, setLimit, setSince, setUntil, clearData } =
  slice.actions;

export default slice.reducer;

/** Selector */
export const Monitoring = (s) => s.monitoring || initialState;
