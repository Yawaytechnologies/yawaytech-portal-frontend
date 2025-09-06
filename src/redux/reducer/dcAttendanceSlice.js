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

// helpers to detect weekend even if API didn't set it
function getDow(dateStr) {
  const [Y, M, D] = dateStr.split("-").map(Number);
  return new Date(Y, M - 1, D).getDay(); // 0 Sun, 6 Sat
}
function nthSaturdayFromDate(dateStr) {
  const d = Number(dateStr.split("-")[2]);
  return Math.floor((d - 1) / 7) + 1;
}

function derive(rows) {
  let present = 0, absent = 0, totalMin = 0;

  const normalized = rows.map((r) => {
    const raw = (r.status || "").toLowerCase();

    // weekend detection (Sunday + non 1st/3rd Saturdays)
    const dow = getDow(r.date);
    const isWeekend =
      dow === 0 || (dow === 6 && ![1, 3].includes(nthSaturdayFromDate(r.date)));

    if (raw === "weekend" || isWeekend) {
      return { ...r, hours: "—", label: "Weekend" }; // not counted in present/absent
    }

    const hasTimes = !!(r.timeIn && r.timeOut);
    const isPresent = raw === "present" || hasTimes;

    if (isPresent) {
      present++;
      const [hi, mi] = (r.timeIn || "0:0").split(":").map(Number);
      const [ho, mo] = (r.timeOut || "0:0").split(":").map(Number);
      totalMin += Math.max(0, (ho * 60 + mo) - (hi * 60 + mi));
      return { ...r, hours: diffHM(r.timeIn, r.timeOut), label: "Present" };
    }

    // Absent
    absent++;
    return { ...r, hours: "—", label: "Absent" };
  });

  return { rows: normalized, present, absent, totalHours: minsToHM(totalMin) };
}

export const dcAttendanceReducer = (state = initial, action) => {
  switch (action.type) {
    case "DC_ATT_RESET":
      return initial;

    case "DC_ATT_SET_MONTH":
      if (state.month === action.payload) return state; // avoid useless updates
      return { ...state, month: action.payload };

    case "DC_ATT_FETCH_REQUEST":
      return { ...state, loading: true, error: null, rows: [] };

    case "DC_ATT_FETCH_SUCCESS": {
      const d = derive(action.payload.rows || []);
      return { ...state, loading: false, error: null, month: action.payload.month, ...d };
    }

    case "DC_ATT_FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload || "Error", rows: [] };

    default:
      return state;
  }
};
