const initial = {
  loading: false,
  error: null,
  month: "",
  rows: [],           // [{date,timeIn,timeOut,hours,label}]
  present: 0,
  absent: 0,
  totalHours: "0h 00m",
};

const minsToHM = (mins) => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
const diffHM = (tin, tout) => {
  if (!tin || !tout) return "—";
  const [hi, mi] = tin.split(":").map(Number);
  const [ho, mo] = tout.split(":").map(Number);
  const mins = Math.max(0, (ho * 60 + mo) - (hi * 60 + mi));
  return minsToHM(mins);
};

function derive(rows) {
  let present = 0, absent = 0, totalMin = 0;
  const normalized = rows.map((r) => {
    const isPresent = (r.status || "").toLowerCase() === "present" || (r.timeIn && r.timeOut);
    if (isPresent) {
      present++;
      const [hi, mi] = (r.timeIn || "0:0").split(":").map(Number);
      const [ho, mo] = (r.timeOut || "0:0").split(":").map(Number);
      totalMin += Math.max(0, (ho*60+mo) - (hi*60+mi));
    } else {
      absent++;
    }
    return { ...r, hours: diffHM(r.timeIn, r.timeOut), label: isPresent ? "Present" : "Absent" };
  });
  return { rows: normalized, present, absent, totalHours: minsToHM(totalMin) };
}

export const devAttendanceReducer = (state = initial, action) => {
  switch (action.type) {
    case "DEV_ATT_RESET":
      return initial;

    case "DEV_ATT_SET_MONTH":
      if (state.month === action.payload) return state; // avoid loops
      return { ...state, month: action.payload };

    case "DEV_ATT_FETCH_REQUEST":
      return { ...state, loading: true, error: null, rows: [] };

    case "DEV_ATT_FETCH_SUCCESS": {
      const d = derive(action.payload.rows || []);
      return { ...state, loading: false, error: null, month: action.payload.month, ...d };
    }

    case "DEV_ATT_FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload || "Error", rows: [] };

    default:
      return state;
  }
};
