const initial = {
  loading: false,
  error: null,
  month: "",
  rows: [],
  present: 0,
  absent: 0,
  totalHours: "0h 00m",
  // NEW:
  employeeName: "",
  employeeCode: "",
};

function hrAttendanceReducer(state = initial, action) {
  switch (action.type) {
    case "HR_ATT_RESET":
      return initial;
    case "HR_ATT_SET_MONTH":
      if (state.month === action.payload) return state;
      return { ...state, month: action.payload };
    case "HR_ATT_FETCH_REQUEST":
      return { ...state, loading: true, error: null };
    case "HR_ATT_FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        error: null,
        ...action.payload,
      };
    case "HR_ATT_FETCH_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload,
        rows: [],
        present: 0,
        absent: 0,
        totalHours: "0h 00m",
        employeeName: "",
        employeeCode: "",
      };
    default:
      return state;
  }
}

export default hrAttendanceReducer;
