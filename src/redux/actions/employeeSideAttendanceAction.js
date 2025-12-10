// /src/redux/actions/employeeSideAttendanceAction.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import employeeSideAttendanceService from "../services/employeeSideAttendanceService";

export const loadAttendanceMonth = createAsyncThunk(
  "attendance/loadMonth",
  async () => employeeSideAttendanceService.fetchMonth()
);

export const checkInToday = createAsyncThunk(
  "attendance/checkInToday",
  async () => employeeSideAttendanceService.checkIn()
);

export const checkOutToday = createAsyncThunk(
  "attendance/checkOutToday",
  async ({ existingInIso } = {}) =>
    employeeSideAttendanceService.checkOut({ existingInIso })
);

export const fetchActiveSession = createAsyncThunk(
  "attendance/fetchActiveSession",
  async () => employeeSideAttendanceService.fetchActiveSession()
);
