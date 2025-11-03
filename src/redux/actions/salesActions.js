// src/redux/actions/salesActions.js
import {
  fetchSalesEmployeesAPI,
  fetchSalesEmployeeByIdAPI,
} from "../services/salesService";

export const fetchSalesEmployees = (opts = {}) => async (dispatch) => {
  dispatch({ type: "SALES_FETCH_REQUEST" });
  try {
    const data = await fetchSalesEmployeesAPI(opts);
    dispatch({ type: "SALES_FETCH_SUCCESS", payload: data });
  } catch (err) {
    dispatch({
      type: "SALES_FETCH_FAILURE",
      payload: err?.message || "Failed to load Sales employees",
    });
  }
};

export const fetchSalesEmployeeById = (employeeId) => async (dispatch) => {
  dispatch({ type: "SALES_DETAIL_REQUEST" });
  try {
    const data = await fetchSalesEmployeeByIdAPI(employeeId);
    dispatch({ type: "SALES_DETAIL_SUCCESS", payload: data });
  } catch (err) {
    dispatch({
      type: "SALES_DETAIL_FAILURE",
      payload: err?.message || "Sales employee not found",
    });
  }
};
