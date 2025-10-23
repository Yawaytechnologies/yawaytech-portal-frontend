// src/redux/reducer/hrSlice.js
const initialState = {
  employees: [],
  loading: false,
  error: null,

  // detail
  selectedEmployee: null,
  detailLoading: false,
  detailError: null,
};

export const hrReducer = (state = initialState, action) => {
  switch (action.type) {
    // list
    case "HR_FETCH_REQUEST":
      return { ...state, loading: true, error: null };
    case "HR_FETCH_SUCCESS":
      return { ...state, loading: false, employees: action.payload || [] };
    case "HR_FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload || "Failed to load HR employees" };

    // detail
    case "HR_DETAIL_REQUEST":
      return { ...state, detailLoading: true, detailError: null, selectedEmployee: null };
    case "HR_DETAIL_SUCCESS":
      return { ...state, detailLoading: false, selectedEmployee: action.payload, detailError: null };
    case "HR_DETAIL_FAILURE":
      return { ...state, detailLoading: false, detailError: action.payload || "Failed to load HR detail", selectedEmployee: null };

    case "HR_DETAIL_RESET":
      return { ...state, selectedEmployee: null, detailLoading: false, detailError: null };

    default:
      return state;
  }
};
