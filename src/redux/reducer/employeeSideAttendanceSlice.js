import { createSlice } from "@reduxjs/toolkit";
import {
  loadAttendanceMonth,
  checkInToday,
  checkOutToday,
} from "../actions/employeeSideAttendanceAction";
import dayjs from "dayjs";

const loadLocal = () => {
  try {
    const bootUser = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("auth.user") ||
            localStorage.getItem("user") ||
            "null",
        );
      } catch {
        return null;
      }
    })();

    const empKey = bootUser?.employeeId || bootUser?.employee_id || "unknown";
    const key = `attendance.${empKey}.records.v1`;

    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    return {};
  }
};

const initialState = {
  records: loadLocal(),
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
      const { key, record } = a.payload || {};
      if (!key) return;
      s.records[key] = { ...(s.records[key] || {}), ...(record || {}) };
    });

    b.addCase(checkOutToday.fulfilled, (s, a) => {
      const { key, record } = a.payload || {};
      if (!key) return;
      s.records[key] = { ...(s.records[key] || {}), ...(record || {}) };
    });
  },
});

export default attendanceSlice.reducer;
export const selectAttendanceRecords = (s) => s.attendance.records;

export const selectIsCheckedIn = (s) => {
  const today = dayjs().format("YYYY-MM-DD");
  const rec = s.attendance.records[today];

  const bootUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("auth.user") ||
          localStorage.getItem("user") ||
          "null",
      );
    } catch {
      return null;
    }
  })();

  const empKey = bootUser?.employeeId || bootUser?.employee_id || "unknown";

  const running =
    localStorage.getItem(`attendance.${empKey}.running`) === "true" &&
    localStorage.getItem(`attendance.${empKey}.date`) === today &&
    !!localStorage.getItem(`attendance.${empKey}.start`);

  return running || (!!rec?.in && !rec?.out);
};
