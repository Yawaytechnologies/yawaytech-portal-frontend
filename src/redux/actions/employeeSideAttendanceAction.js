import dayjs from "dayjs";

import { createAsyncThunk } from "@reduxjs/toolkit";
import employeeSideAttendanceService from "../services/employeeSideAttendanceService";

export const loadAttendanceMonth = createAsyncThunk(
  "attendance/loadMonth",
  async ({ employeeId, monthISO } = {}) => {
    const iso = monthISO || dayjs().startOf("month").format("YYYY-MM-01");

    return employeeSideAttendanceService.fetchMonth({
      employeeId,
      monthISO: iso,
    });
  },
);

export const checkInToday = createAsyncThunk(
  "attendance/checkInToday",

  async ({ employeeId } = {}) =>
    employeeSideAttendanceService.checkIn({ employeeId }),
);

export const checkOutToday = createAsyncThunk(
  "attendance/checkOutToday",
  async ({ employeeId, existingInIso } = {}) =>
    employeeSideAttendanceService.checkOut({ employeeId, existingInIso }),
);
