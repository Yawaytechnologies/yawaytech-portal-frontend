import { createSlice } from "@reduxjs/toolkit";
import { loadAttendanceMonth, checkInToday, checkOutToday } from "../actions/employeeSideAttendanceAction";
import dayjs from "dayjs";

const initialState = {
  records: {},   // { 'YYYY-MM-DD': { in, out, totalMs } }
  status: "idle",
  error: null,
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(loadAttendanceMonth.pending, (s) => { s.status = "loading"; s.error = null; })
      .addCase(loadAttendanceMonth.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.records = a.payload || {};
      })
      .addCase(loadAttendanceMonth.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.error?.message || "Failed to load attendance";
      })

      // ✅ merge today's check-in result
      .addCase(checkInToday.fulfilled, (s, a) => {
        const { key, record } = a.payload;
        s.records[key] = { ...(s.records[key] || {}), ...record };
      })

      // ✅ merge today's check-out result
      .addCase(checkOutToday.fulfilled, (s, a) => {
        const { key, record } = a.payload;
        s.records[key] = { ...(s.records[key] || {}), ...record };
      });
  },
});

export default attendanceSlice.reducer;

export const selectAttendanceRecords = (s) => s.attendance.records;
export const selectIsCheckedIn = (s) => {
  const today = dayjs().format("YYYY-MM-DD");
  const rec = s.attendance.records[today];
  return !!(rec && rec.in && !rec.out);
};
