// src/redux/reducer/financeSlice.js
const initialState = {
  employees: [],
  loading: false,
  error: null,

  selectedEmployee: null,
  detailLoading: false,
  detailError: null,
};

export default function FinanceReducer(state = initialState, action) {
  switch (action.type) {
    // list
    case "FINANCE_FETCH_REQUEST":
      return { ...state, loading: true, error: null };
    case "FINANCE_FETCH_SUCCESS":
      return { ...state, loading: false, employees: action.payload || [] };
    case "FINANCE_FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload };

    // detail
    case "FINANCE_DETAIL_REQUEST":
      return { ...state, detailLoading: true, detailError: null, selectedEmployee: null };
    case "FINANCE_DETAIL_SUCCESS":
      return { ...state, detailLoading: false, selectedEmployee: action.payload, detailError: null };
    case "FINANCE_DETAIL_FAILURE":
      return { ...state, detailLoading: false, detailError: action.payload, selectedEmployee: null };

    case "FINANCE_DETAIL_RESET":
      return { ...state, selectedEmployee: null, detailLoading: false, detailError: null };

    default:
      return state;
  }
}
