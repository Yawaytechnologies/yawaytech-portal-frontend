// /src/redux/reducer/employeeSideAttendanceSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  loadAttendanceMonth,
  checkInToday,
  checkOutToday,
  fetchActiveSession,
} from "../actions/employeeSideAttendanceAction";
import dayjs from "dayjs";

const initialState = {
  records: {},
  status: "idle",
  error: null,
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loadAttendanceMonth.fulfilled, (s, a) => {
      s.records = a.payload || {};
    });

    b.addCase(checkInToday.fulfilled, (s, a) => {
      const { key, record } = a.payload;
      s.records[key] = { ...(s.records[key] || {}), ...record };
    });

    b.addCase(checkOutToday.fulfilled, (s, a) => {
      const { key, record } = a.payload;
      s.records[key] = { ...(s.records[key] || {}), ...record };
    });

    b.addCase(fetchActiveSession.fulfilled, (s, a) => {
      if (!a.payload) return;

      const key = dayjs().format("YYYY-MM-DD");

      s.records[key] = {
        ...(s.records[key] || {}),
        in: a.payload.checkInUtc,
        out: a.payload.checkOutUtc || null,
      };
    });
  },
});

export default attendanceSlice.reducer;

export const selectAttendanceRecords = (s) => s.attendance.records;

export const selectIsCheckedIn = (s) => {
  const today = dayjs().format("YYYY-MM-DD");
  const rec = s.attendance.records[today];

  // Check localStorage fallback (for reload / new tab)
  const running = localStorage.getItem("attendance.running") === "true";

  return running || (!!rec?.in && !rec?.out);
};

