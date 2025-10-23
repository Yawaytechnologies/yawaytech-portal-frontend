// src/redux/actions/hrActions.js
import { fetchHREmployeesAPI, fetchHREmployeeByIdAPI } from "../services/hrService";

export const fetchHREmployees = (opts = {}) => async (dispatch) => {
  dispatch({ type: "HR_FETCH_REQUEST" });
  try {
    const data = await fetchHREmployeesAPI(opts);
    dispatch({ type: "HR_FETCH_SUCCESS", payload: data });
  } catch (err) {
    dispatch({ type: "HR_FETCH_FAILURE", payload: err?.message || "Failed to load HR employees" });
  }
};

export const fetchHREmployeeById = (employeeId) => async (dispatch) => {
  dispatch({ type: "HR_DETAIL_REQUEST" });
  try {
    const data = await fetchHREmployeeByIdAPI(employeeId);
    dispatch({ type: "HR_DETAIL_SUCCESS", payload: data });
  } catch (err) {
    dispatch({ type: "HR_DETAIL_FAILURE", payload: err?.message || "HR employee not found" });
  }
};
