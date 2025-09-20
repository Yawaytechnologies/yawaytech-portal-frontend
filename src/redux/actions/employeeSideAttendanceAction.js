import { createAsyncThunk } from "@reduxjs/toolkit";
import employeeSideAttendanceService from "../services/employeeSideAttendanceService";

// optional (currently returns {} because there’s no GET on backend)
export const loadAttendanceMonth = createAsyncThunk(
  "attendance/loadMonth",
  async (monthLike) => employeeSideAttendanceService.fetchMonth(monthLike)
);

export const checkInToday = createAsyncThunk(
  "attendance/checkInToday",
  async () => employeeSideAttendanceService.checkIn()
);

export const checkOutToday = createAsyncThunk(
  "attendance/checkOutToday",
  async ({ existingInIso } = {}) => employeeSideAttendanceService.checkOut({ existingInIso })
);
