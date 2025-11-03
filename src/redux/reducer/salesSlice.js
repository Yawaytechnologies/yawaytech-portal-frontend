// src/redux/reducer/salesSlice.js
const initialState = {
  employees: [],
  loading: false,
  error: null,

  selectedEmployee: null,
  detailLoading: false,
  detailError: null,
};

export default function SalesReducer(state = initialState, action) {
  switch (action.type) {
    // list
    case "SALES_FETCH_REQUEST":
      return { ...state, loading: true, error: null };
    case "SALES_FETCH_SUCCESS":
      return { ...state, loading: false, employees: action.payload || [] };
    case "SALES_FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload };

    // detail
    case "SALES_DETAIL_REQUEST":
      return { ...state, detailLoading: true, detailError: null, selectedEmployee: null };
    case "SALES_DETAIL_SUCCESS":
      return { ...state, detailLoading: false, selectedEmployee: action.payload, detailError: null };
    case "SALES_DETAIL_FAILURE":
      return { ...state, detailLoading: false, detailError: action.payload, selectedEmployee: null };

    case "SALES_DETAIL_RESET":
      return { ...state, selectedEmployee: null, detailLoading: false, detailError: null };

    default:
      return state;
  }
}
