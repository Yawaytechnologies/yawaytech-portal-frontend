const initial = {
  loading: false,
  error: null,
  month: "",
  rows: [],           // [{date,timeIn,timeOut,hours,label}]
  present: 0,
  absent: 0,
  totalHours: "0h 00m",
};

const minsToHM = (mins) =>
  `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;

const computeMins = (tin, tout) => {
  if (!tin || !tout) return 0;
  const [hi, mi] = tin.split(":").map(Number);
  const [ho, mo] = tout.split(":").map(Number);
  return Math.max(0, (ho * 60 + mo) - (hi * 60 + mi));
};

// weekend helpers (Sun + 2nd/4th/5th Sat are non-working)
const nthSaturday = (day) => Math.floor((day - 1) / 7) + 1; // 1..5
const isNonWorkingWeekend = (dateStr) => {
  if (!dateStr) return false;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return false;
  const dow = new Date(y, m - 1, d).getDay(); // 0..6 (Sun..Sat)
  if (dow === 0) return true; // Sunday
  if (dow === 6) {
    const nth = nthSaturday(d);
    return nth === 2 || nth === 4 || nth === 5; // 2nd/4th/5th Sat
  }
  return false;
};

function derive(rows) {
  let present = 0, absent = 0, totalMin = 0;

  const normalized = (rows || []).map((r) => {
    // Prefer incoming label; otherwise infer
    let label = r.label || (r.status ? String(r.status).trim() : "");
    if (!label) label = (r.timeIn && r.timeOut) ? "Present" : "Absent";

    // Coerce to weekend if date says so
    const weekendByDate = isNonWorkingWeekend(r.date);
    if (weekendByDate) label = "Weekend";

    const L = label.toLowerCase();
    const isWeekend = L === "weekend";
    const isPresent = L === "present";
    const isAbsent  = L === "absent";

    let hours = r.hours || "—";

    if (isWeekend) {
      // Weekend: not counted as absent, no hours
      hours = "—";
    } else if (isPresent) {
      const mins = r._mins ?? computeMins(r.timeIn, r.timeOut);
      totalMin += mins;
      present++;
      hours = r.hours || minsToHM(mins);
    } else if (isAbsent) {
      absent++;
      hours = "—";
    }

    return {
      ...r,
      label: isWeekend ? "Weekend" : isPresent ? "Present" : "Absent",
      hours,
    };
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
      return {
        ...state,
        loading: false,
        error: null,
        month: action.payload.month,
        ...d,
      };
    }

    case "DEV_ATT_FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload || "Error", rows: [] };

    default:
      return state;
  }
};
