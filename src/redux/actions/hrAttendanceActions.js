import { fetchAttendanceByMonthAPI } from "../services/hrAttendanceService";

export const setAttendanceMonth = (monthStr) => ({ type: "HR_ATT_SET_MONTH", payload: monthStr });
export const clearAttendance = () => ({ type: "HR_ATT_RESET" });

const fmtHM = (mins) => {
  if (!Number.isFinite(mins) || mins < 0) return "0h 00m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};

export const fetchAttendanceByMonth = (employeeId, monthStr) => async (dispatch) => {
  dispatch({ type: "HR_ATT_FETCH_REQUEST" });
  try {
    const resp = await fetchAttendanceByMonthAPI(employeeId, monthStr);
    // backward-compatible: accept either array or {rows,meta}
    const rows = Array.isArray(resp) ? resp : resp.rows;
    const employeeName = Array.isArray(resp) ? ""  : (resp.meta?.employeeName || "");
    const employeeCode = Array.isArray(resp) ? ""  : (resp.meta?.employeeCode || "");

    const present = rows.filter((r) => r.label === "Present").length;
    const absent  = rows.filter((r) => r.label === "Absent").length;
    const totalMin = rows.reduce((acc, r) => acc + (r.label === "Present" ? (r._mins || 0) : 0), 0);

    dispatch({
      type: "HR_ATT_FETCH_SUCCESS",
      payload: {
        month: monthStr,
        rows,
        present,
        absent,
        totalHours: fmtHM(totalMin),
        employeeName,
        employeeCode,
      },
    });
  } catch (e) {
    dispatch({
      type: "HR_ATT_FETCH_FAILURE",
      payload: e.message || "Failed to load attendance",
    });
  }
};
