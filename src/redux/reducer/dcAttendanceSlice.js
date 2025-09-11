// src/redux/reducer/dcAttendanceSlice.js

const initial = {
  loading: false,
  error: null,
  month: "",
  rows: [],
  present: 0,
  absent: 0,
  totalHours: "0h 00m",
  // Optional: employeeName/employeeCode if your API returns meta
  employeeName: "",
  employeeCode: "",
};

function dcAttendanceReducer(state = initial, action) {
  switch (action.type) {
    case "DC_ATT_RESET":
      return initial;

    case "DC_ATT_SET_MONTH":
      if (state.month === action.payload) return state;
      return { ...state, month: action.payload };

    case "DC_ATT_FETCH_REQUEST":
      return { ...state, loading: true, error: null };

    case "DC_ATT_FETCH_SUCCESS":
      return { ...state, loading: false, error: null, ...action.payload };

    case "DC_ATT_FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload, rows: [], present: 0, absent: 0, totalHours: "0h 00m" };

    default:
      return state;
  }
}

export default dcAttendanceReducer;
