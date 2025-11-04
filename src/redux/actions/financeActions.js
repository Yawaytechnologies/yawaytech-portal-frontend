// src/redux/actions/financeActions.js
import {
  fetchFinanceEmployeesAPI,
  fetchFinanceEmployeeByIdAPI,
} from "../services/financeService";

export const fetchFinanceEmployees = (opts = {}) => async (dispatch) => {
  dispatch({ type: "FINANCE_FETCH_REQUEST" });
  try {
    const data = await fetchFinanceEmployeesAPI(opts);
    dispatch({ type: "FINANCE_FETCH_SUCCESS", payload: data });
  } catch (err) {
    dispatch({
      type: "FINANCE_FETCH_FAILURE",
      payload: err?.message || "Failed to load Finance employees",
    });
  }
};

export const fetchFinanceEmployeeById = (employeeId) => async (dispatch) => {
  dispatch({ type: "FINANCE_DETAIL_REQUEST" });
  try {
    const data = await fetchFinanceEmployeeByIdAPI(employeeId);
    dispatch({ type: "FINANCE_DETAIL_SUCCESS", payload: data });
  } catch (err) {
    dispatch({
      type: "FINANCE_DETAIL_FAILURE",
      payload: err?.message || "Finance employee not found",
    });
  }
};
