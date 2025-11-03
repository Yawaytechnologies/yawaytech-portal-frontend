// src/redux/reducer/marketingOverviewSlice.js
const initialState = {
  loading: false,
  error: null,
  selectedEmployee: null,
};

export const marketingOverviewReducer = (state = initialState, action) => {
  switch (action.type) {
    case "MARKETING_DETAIL_RESET":
      return initialState;
    case "MARKETING_DETAIL_REQUEST":
      return { ...state, loading: true, error: null, selectedEmployee: null };
    case "MARKETING_DETAIL_SUCCESS":
      return { ...state, loading: false, selectedEmployee: action.payload };
    case "MARKETING_DETAIL_FAILURE":
      return { ...state, loading: false, error: action.payload, selectedEmployee: null };
    default:
      return state;
  }
};

export default marketingOverviewReducer;
