const initialState = {
  loading: false,
  error: null,
  selectedEmployee: null,
};

export const hrOverviewReducer = (state = initialState, action) => {
  switch (action.type) {
    case "HR_DETAIL_RESET":
      return initialState;
    case "HR_DETAIL_REQUEST":
      return { ...state, loading: true, error: null, selectedEmployee: null };
    case "HR_DETAIL_SUCCESS":
      return { ...state, loading: false, selectedEmployee: action.payload };
    case "HR_DETAIL_FAILURE":
      return { ...state, loading: false, error: action.payload, selectedEmployee: null };
    default:
      return state;
      
  }
};
