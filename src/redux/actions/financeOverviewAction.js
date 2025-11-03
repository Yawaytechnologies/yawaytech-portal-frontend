// src/redux/actions/financeOverviewAction.js
import { fetchFinanceByIdAPI } from "../services/financeOverviewService";

export const fetchFinanceById = (employeeId) => async (dispatch) => {
  dispatch({ type: "FINANCE_DETAIL_REQUEST" });
  try {
    const data = await fetchFinanceByIdAPI(employeeId);
    dispatch({ type: "FINANCE_DETAIL_SUCCESS", payload: data });
  } catch (error) {
    dispatch({
      type: "FINANCE_DETAIL_FAILURE",
      payload: error?.message || "Employee not found",
    });
  }
};
