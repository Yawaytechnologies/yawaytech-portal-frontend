// src/redux/reducer/salesOverviewSlice.js
const initialState = { loading: false, error: null, selectedEmployee: null };

export const salesOverviewReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SALES_DETAIL_RESET":
      return initialState;
    case "SALES_DETAIL_REQUEST":
      return { ...state, loading: true, error: null, selectedEmployee: null };
    case "SALES_DETAIL_SUCCESS":
      return { ...state, loading: false, selectedEmployee: action.payload };
    case "SALES_DETAIL_FAILURE":
      return { ...state, loading: false, error: action.payload, selectedEmployee: null };
    default:
      return state;
  }
};

export default salesOverviewReducer;
