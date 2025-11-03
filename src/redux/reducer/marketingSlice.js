// src/redux/reducer/marketingSlice.js
const initialState = {
  employees: [],
  loading: false,
  error: null,

  selectedEmployee: null,
  detailLoading: false,
  detailError: null,
};

export default function MarketingReducer(state = initialState, action) {
  switch (action.type) {
    // list
    case "MARKETING_FETCH_REQUEST":
      return { ...state, loading: true, error: null };
    case "MARKETING_FETCH_SUCCESS":
      return { ...state, loading: false, employees: action.payload || [] };
    case "MARKETING_FETCH_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload || "Failed to load Marketing employees",
      };

    // detail
    case "MARKETING_DETAIL_REQUEST":
      return { ...state, detailLoading: true, detailError: null, selectedEmployee: null };
    case "MARKETING_DETAIL_SUCCESS":
      return { ...state, detailLoading: false, selectedEmployee: action.payload, detailError: null };
    case "MARKETING_DETAIL_FAILURE":
      return {
        ...state,
        detailLoading: false,
        detailError: action.payload || "Failed to load Marketing detail",
        selectedEmployee: null,
      };

    case "MARKETING_DETAIL_RESET":
      return { ...state, selectedEmployee: null, detailLoading: false, detailError: null };

    default:
      return state;
  }
}
