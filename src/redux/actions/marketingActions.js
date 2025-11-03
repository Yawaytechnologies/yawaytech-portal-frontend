// src/redux/actions/marketingActions.js
import {
  fetchMarketingEmployeesAPI,
  fetchMarketingEmployeeByIdAPI,
} from "../services/marketingService";

export const fetchMarketingEmployees = (opts = {}) => async (dispatch) => {
  dispatch({ type: "MARKETING_FETCH_REQUEST" });
  try {
    const data = await fetchMarketingEmployeesAPI(opts);
    dispatch({ type: "MARKETING_FETCH_SUCCESS", payload: data });
  } catch (err) {
    dispatch({
      type: "MARKETING_FETCH_FAILURE",
      payload: err?.message || "Failed to load Marketing employees",
    });
  }
};

export const fetchMarketingEmployeeById = (employeeId) => async (dispatch) => {
  dispatch({ type: "MARKETING_DETAIL_REQUEST" });
  try {
    const data = await fetchMarketingEmployeeByIdAPI(employeeId);
    dispatch({ type: "MARKETING_DETAIL_SUCCESS", payload: data });
  } catch (err) {
    dispatch({
      type: "MARKETING_DETAIL_FAILURE",
      payload: err?.message || "Marketing employee not found",
    });
  }
};
