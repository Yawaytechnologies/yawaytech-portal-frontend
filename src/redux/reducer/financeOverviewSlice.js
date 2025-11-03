// src/redux/reducer/financeOverviewSlice.js
const initialState = { loading: false, error: null, selectedEmployee: null };

export const financeOverviewReducer = (state = initialState, action) => {
  switch (action.type) {
    case "FINANCE_DETAIL_RESET":
      return initialState;
    case "FINANCE_DETAIL_REQUEST":
      return { ...state, loading: true, error: null, selectedEmployee: null };
    case "FINANCE_DETAIL_SUCCESS":
      return { ...state, loading: false, selectedEmployee: action.payload };
    case "FINANCE_DETAIL_FAILURE":
      return { ...state, loading: false, error: action.payload, selectedEmployee: null };
    default:
      return state;
  }
};

export default financeOverviewReducer;
