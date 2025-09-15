// src/redux/actions/dcAttendanceActions.js
import { fetchDcAttendanceByMonthAPI } from "../services/dcAttendanceService";

const fmtHM = (mins) => {
  if (!Number.isFinite(mins) || mins < 0) return "0h 00m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};

export const setDcAttendanceMonth = (monthStr) => ({
  type: "DC_ATT_SET_MONTH",
  payload: monthStr,
});

export const clearDcAttendance = () => ({ type: "DC_ATT_RESET" });

/** Thunk: loads attendance and derives counters/totals (weekends excluded) */
export const fetchDcAttendanceByMonth = (employeeId, monthStr) => async (dispatch) => {
  dispatch({ type: "DC_ATT_FETCH_REQUEST" });
  try {
    const rows = await fetchDcAttendanceByMonthAPI(employeeId, monthStr);

    const present = rows.filter((r) => r.label === "Present").length;
    const absent  = rows.filter((r) => r.label === "Absent").length; // don't count Weekend
    const totalMin = rows.reduce((acc, r) => acc + (r.label === "Present" ? (r._mins || 0) : 0), 0);

    dispatch({
      type: "DC_ATT_FETCH_SUCCESS",
      payload: { month: monthStr, rows, present, absent, totalHours: fmtHM(totalMin) },
    });
  } catch (e) {
    dispatch({ type: "DC_ATT_FETCH_FAILURE", payload: e.message || "Failed to load attendance" });
  }
};
