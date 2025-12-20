// src/components/EmployeeMonitoring.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Monitoring,
  setEmployeeId as setEmployeeIdStore,
  setLimit as setLimitStore,
  setSince as setSinceStore,
  setUntil as setUntilStore,
} from "../redux/reducer/monitoringSlice";
import { fetchMonitoring } from "../redux/actions/monitoringActions";
import { getApiBase } from "../redux/services/monitoringService";
import { toast, Slide } from "react-toastify";
import { FiCalendar } from "react-icons/fi";

/* ✅ NEW: normalize YYYY-MM-DDTHH:mm (year 4 digit, month 01-12, day 01-30, hour 00-23, minute 00-59) */
function normalizeYMDHM(value) {
  const raw = String(value ?? "").trim();

  // allow digits, -, T, :, space (space becomes T)
  let safe = raw.replace(/[^\dT:\-\s]/g, "").replace(" ", "T");

  // split date & time
  const [datePart = "", timePart = ""] = safe.split("T");

  // ---- date (YYYY-MM-DD) ----
  const dsafe = datePart.replace(/[^\d-]/g, "");
  const [yRaw = "", mRaw = "", dRaw = ""] = dsafe.split("-");

  const y = yRaw.slice(0, 4);

  // month 01-12
  let m = mRaw.replace(/[^\d]/g, "").slice(0, 2);
  if (m.length === 2) {
    let mm = Number(m);
    if (Number.isNaN(mm)) mm = 1;
    if (mm < 1) mm = 1;
    if (mm > 12) mm = 12;
    m = String(mm).padStart(2, "0");
  }

  // day 01-30
  let d = dRaw.replace(/[^\d]/g, "").slice(0, 2);
  if (d.length === 2) {
    let dd = Number(d);
    if (Number.isNaN(dd)) dd = 1;
    if (dd < 1) dd = 1;
    if (dd > 31) dd = 31;
    d = String(dd).padStart(2, "0");
  }

  // build date progressively while typing
  let out = y;
  if (dsafe.includes("-") || m.length) out += "-" + m;
  if ((dsafe.match(/-/g) || []).length >= 2 || d.length) out += "-" + d;

  // ---- time (HH:mm) ----
  const tsafe = timePart.replace(/[^\d:]/g, "");
  let [hRaw = "", minRaw = ""] = tsafe.split(":");

  let hh = hRaw.replace(/[^\d]/g, "").slice(0, 2);
  if (hh.length === 2) {
    let H = Number(hh);
    if (Number.isNaN(H)) H = 0;
    if (H < 0) H = 0;
    if (H > 23) H = 23;
    hh = String(H).padStart(2, "0");
  }

  let mi = minRaw.replace(/[^\d]/g, "").slice(0, 2);
  if (mi.length === 2) {
    let M = Number(mi);
    if (Number.isNaN(M)) M = 0;
    if (M < 0) M = 0;
    if (M > 59) M = 59;
    mi = String(M).padStart(2, "0");
  }

  // add time progressively only if user started typing time
  if (safe.includes("T") || hh.length) {
    out += "T" + hh;
    if (tsafe.includes(":") || mi.length) out += ":" + mi;
  }

  return out.slice(0, 16); // YYYY-MM-DDTHH:mm
}

/* --------- datetime-local normalizer: always -> YYYY-MM-DDTHH:mm --------- */
const toDatetimeLocal = (v) => {
  if (!v) return "";
  const s = String(v).trim();

  const clamp2 = (num, min, max) => {
    const n = Number(num);
    if (!Number.isFinite(n)) return String(min).padStart(2, "0");
    return String(Math.min(max, Math.max(min, n))).padStart(2, "0");
  };

  // ISO with too-long year: 202512-12-18T06:30 -> 2025-12-18T06:30
  const mYearTooLongISO = s.match(
    /^(\d{4})\d+-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/
  );
  if (mYearTooLongISO) {
    const yyyy = mYearTooLongISO[1];
    const mm = mYearTooLongISO[2];
    const dd = mYearTooLongISO[3];
    const HH = mYearTooLongISO[4];
    const MI = mYearTooLongISO[5];
    return `${yyyy}-${mm}-${dd}T${HH}:${MI}`;
  }

  // Already correct: 2025-12-18T06:30 (or with seconds)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const yyyy = s.slice(0, 4);
    const mm = clamp2(s.slice(5, 7), 1, 12);
    const dd = clamp2(s.slice(8, 10), 1, 30);
    const HH = clamp2(s.slice(11, 13), 0, 23);
    const MI = clamp2(s.slice(14, 16), 0, 59);
    return `${yyyy}-${mm}-${dd}T${HH}:${MI}`;
  }

  // "YYYY-MM-DD" -> add time
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00`;

  // "DD-MM-YYYY" -> clamp year + add time
  const mDateOnly = s.match(/^(\d{2})-(\d{2})-(\d{4,})$/);
  if (mDateOnly) {
    const dd = mDateOnly[1];
    const mm = mDateOnly[2];
    const yyyy = String(mDateOnly[3]).slice(0, 4);
    return `${yyyy}-${mm}-${dd}T00:00`;
  }

  // "YYYY-MM-DD HH:mm" -> "YYYY-MM-DDTHH:mm"
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s))
    return s.replace(" ", "T").slice(0, 16);

  // "DD-MM-YYYY HH:mm" -> "YYYY-MM-DDTHH:mm" (clamp year)
  const m1 = s.match(/^(\d{2})-(\d{2})-(\d{4,})\s(\d{2}):(\d{2})/);
  if (m1) {
    const dd = m1[1];
    const mm = m1[2];
    const yyyy = String(m1[3]).slice(0, 4);
    const HH = m1[4];
    const MI = m1[5];
    return `${yyyy}-${mm}-${dd}T${HH}:${MI}`;
  }

  // fallback parse
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return "";
};

/* ✅ Clamp year WHILE typing (prevents 5/6 digit year showing in the field) */
const clampYearWhileTyping = (raw) => {
  if (!raw) return "";

  let s = String(raw).trim();

  // Keep only digits, '-', 'T', ':', space
  s = s.replace(/[^\d\-T:\s]/g, "");

  // Convert space -> T (helps if user types "YYYY-MM-DD HH:mm")
  s = s.replace(" ", "T");

  // Clamp year (ISO): 202512-12-18T06:30 -> 2025-12-18T06:30
  s = s.replace(/^(\d{4})\d+(-\d{2}-\d{2})/, "$1$2");

  // Clamp year (DD-MM-YYYY): 12-12-39067T07:34 -> 12-12-3906T07:34
  s = s.replace(/^(\d{2}-\d{2}-)(\d{4})\d+/, "$1$2");

  // --- clamp month/day/hour/min while typing (only when 2 digits exist) ---
  const iso = s.match(
    /^(\d{0,4})(?:-(\d{0,2}))?(?:-(\d{0,2}))?(?:T(\d{0,2}))?(?::(\d{0,2}))?/
  );
  if (iso) {
    let [, y = "", m = "", d = "", hh = "", mi = ""] = iso;

    y = y.slice(0, 4);

    if (m.length === 2) {
      let mm = Number(m);
      if (!Number.isFinite(mm)) mm = 1;
      if (mm < 1) mm = 1;
      if (mm > 12) mm = 12;
      m = String(mm).padStart(2, "0");
    } else m = m.slice(0, 2);

    if (d.length === 2) {
      let dd = Number(d);
      if (!Number.isFinite(dd)) dd = 1;
      if (dd < 1) dd = 1;
      if (dd > 30) dd = 30;
      d = String(dd).padStart(2, "0");
    } else d = d.slice(0, 2);

    if (hh.length === 2) {
      let H = Number(hh);
      if (!Number.isFinite(H)) H = 0;
      if (H < 0) H = 0;
      if (H > 23) H = 23;
      hh = String(H).padStart(2, "0");
    } else hh = hh.slice(0, 2);

    if (mi.length === 2) {
      let M = Number(mi);
      if (!Number.isFinite(M)) M = 0;
      if (M < 0) M = 0;
      if (M > 59) M = 59;
      mi = String(M).padStart(2, "0");
    } else mi = mi.slice(0, 2);

    // Build progressively (don’t force parts user hasn't typed)
    let out = y;
    if (s.includes("-") || m.length) out += "-" + m;
    if ((s.match(/-/g) || []).length >= 2 || d.length) out += "-" + d;
    if (s.includes("T") || hh.length) out += "T" + hh;
    if (s.includes(":") || mi.length) out += ":" + mi;

    return out.slice(0, 16); // YYYY-MM-DDTHH:mm
  }

  return s.slice(0, 16);
};

/* Open native picker (Chrome/Edge support showPicker) */
const openPicker = (ref) => {
  const el = ref?.current;
  if (!el) return;
  try {
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  } catch {
    el.focus();
  }
};

/* 🔔 Toastify pill config */
const TOAST_BASE = {
  position: "top-center",
  transition: Slide,
  autoClose: 1800,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
};

const PILL = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  width: "auto",
  maxWidth: "min(72vw, 260px)",
  padding: "5px 9px",
  lineHeight: 1.2,
  minHeight: 0,
  borderRadius: "10px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
  fontSize: "0.80rem",
  fontWeight: 600,
};

const STYLE_ERROR = {
  ...PILL,
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
};

const ACCENT_BLUE = "#005BAC";
const ACCENT_ORANGE = "#FF5800";

const UI = {
  card: "rounded-xl bg-white border border-slate-200 shadow-sm",
  headerCard:
    "rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden",
  label: "text-[11px] font-semibold tracking-wide text-slate-500 uppercase",
  inputBase:
    "w-full px-3 py-2 rounded-lg bg-slate-50 text-[13px] text-slate-900 border border-slate-200 " +
    "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-slate-400",
  btnPrimary:
    "px-4 py-2.5 rounded-lg bg-[#FF5800] text-white font-medium shadow-sm hover:brightness-110 active:scale-[.99] transition",
  btnSecondary:
    "px-4 py-2.5 rounded-lg bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 active:scale-[.99] transition",
  chip: "px-2.5 py-1 rounded-full text-[12px] bg-slate-100 text-slate-700 border border-slate-200",
  kpiTitle: "text-[12px] font-medium text-slate-500",
  kpiValue: "text-[10px] font-semibold text-slate-900 leading-tight",
};

function DatetimeField({
  label,
  value,
  onChange,
  onBlur,
  inputRef,
  onKeyDown,
}) {
  return (
    <div className="flex flex-col">
      <label className={UI.label}>{label}</label>

      <div className="relative">
        {/* input (typing allowed) */}
        <input
          ref={inputRef}
          type="datetime-local"
          className={`${UI.inputBase} pr-10 dt-input`}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />

        {/* our calendar button (always opens picker) */}
        <button
          type="button"
          onClick={() => openPicker(inputRef)}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md
                     flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50"
          aria-label="Open calendar"
          title="Open calendar"
        >
          <FiCalendar size={14} className="text-slate-600" />
        </button>
      </div>
    </div>
  );
}

function MonitoringViewer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { employeeId, limit, since, until, data, status, error } =
    useSelector(Monitoring);

  const apiBase = getApiBase();

  const [empId, setEmpId] = useState((employeeId || "").toUpperCase());
  const [limitLocal, setLimitLocal] = useState(limit || 100);
  const [sinceLocal, setSinceLocal] = useState(toDatetimeLocal(since) || "");
  const [untilLocal, setUntilLocal] = useState(toDatetimeLocal(until) || "");
  const [showApiBar, setShowApiBar] = useState(!apiBase);

  const empInputRef = useRef(null);
  const sinceRef = useRef(null);
  const untilRef = useRef(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", ACCENT_ORANGE);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get("id");
    const last = localStorage.getItem("ytp_employee_id") || "YTP000007";
    const initial = (fromQuery || employeeId || empId || last).toUpperCase();
    setEmpId(initial);
    if (empInputRef.current) empInputRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (employeeId) setEmpId(employeeId.toUpperCase());
  }, [employeeId]);

  useEffect(() => {
    if (limit) setLimitLocal(limit);
  }, [limit]);

  useEffect(() => {
    if (since !== undefined) setSinceLocal(toDatetimeLocal(since) || "");
  }, [since]);

  useEffect(() => {
    if (until !== undefined) setUntilLocal(toDatetimeLocal(until) || "");
  }, [until]);

  useEffect(() => {
    if (status === "failed" && error) {
      const msg =
        typeof error === "string"
          ? error
          : error?.message ||
            "Failed to load monitoring data. Please try again.";
      toast(msg, { ...TOAST_BASE, style: STYLE_ERROR, icon: false });
    }
  }, [status, error]);

  const onFetch = () => {
    const base = getApiBase();
    if (!base) {
      setShowApiBar(true);
      return;
    }

    const id = (empId || "").trim().toUpperCase();
    if (!id) return;

    localStorage.setItem("ytp_employee_id", id);

    dispatch(setEmployeeIdStore(id));
    dispatch(setLimitStore(limitLocal || 1));

    const sinceNorm = toDatetimeLocal(sinceLocal);
    const untilNorm = toDatetimeLocal(untilLocal);

    dispatch(setSinceStore(sinceNorm || ""));
    dispatch(setUntilStore(untilNorm || ""));

    dispatch(
      fetchMonitoring({
        employeeId: id,
        limit: limitLocal || 100,
        since: sinceNorm || undefined,
        until: untilNorm || undefined,
      })
    );
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idFromQuery = params.get("id");
    if (!apiBase || !idFromQuery) return;

    const id = idFromQuery.toUpperCase();
    setEmpId(id);
    localStorage.setItem("ytp_employee_id", id);

    dispatch(setEmployeeIdStore(id));
    dispatch(setLimitStore(limitLocal || 100));
    dispatch(setSinceStore(sinceLocal || ""));
    dispatch(setUntilStore(untilLocal || ""));

    dispatch(
      fetchMonitoring({
        employeeId: id,
        limit: limitLocal || 100,
        since: sinceLocal || undefined,
        until: untilLocal || undefined,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, location.search, dispatch]);

  const onKeyDown = (e) => {
    if (
      e.key === "Enter" ||
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter")
    ) {
      onFetch();
    }
  };

  const onEmpIdChange = (v) => setEmpId(v.toUpperCase());
  const onEmpIdBlur = () => setEmpId((empId || "").trim().toUpperCase());

  const items = useMemo(
    () => (Array.isArray(data?.items) ? data.items : []),
    [data?.items]
  );
  const newest = items[0];

  const aggApps = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      (it.active_apps || []).forEach((a) => map.set(a, (map.get(a) || 0) + 1));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [items]);

  const aggSites = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      (it.visited_sites || []).forEach((s) => {
        const key = s.host || s.title || "—";
        map.set(key, (map.get(key) || 0) + 1);
      });
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [items]);

  const noApi = !apiBase;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
      {/* hide native calendar icon so only our button shows */}
      <style>{`
        input.dt-input::-webkit-calendar-picker-indicator{
          opacity:0;
          display:none;
        }
      `}</style>

      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-[#FF5800] underline hover:opacity-80"
          title="Go back"
          aria-label="Go back"
        >
          ← Back
        </button>
      </div>

      {showApiBar && <div className={UI.card}>{/* placeholder */}</div>}

      {/* Header / Controls */}
      <div className={UI.headerCard}>
        <div
          className="absolute inset-x-0 top-0 h-1.5"
          style={{
            background: `linear-gradient(90deg, ${ACCENT_ORANGE}, ${ACCENT_BLUE})`,
          }}
        />
        <div className="p-4">
          {/* ✅ 1024/1440 layout: left-right from lg */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-4 lg:items-start">
            {/* LEFT: Title + Status + KPIs */}
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
                Monitoring Viewer
              </h1>

              <div className="mt-3 text-sm min-w-0">
                {status === "loading" && (
                  <span className="text-slate-500">Loading…</span>
                )}
                {status === "failed" && (
                  <span className="text-rose-600">Error: {error}</span>
                )}
                {status === "succeeded" && (
                  <span className="text-slate-600">
                    {data?.employee_name ? (
                      <span className="text-slate-900">
                        {data.employee_name}
                      </span>
                    ) : (
                      "Unknown User"
                    )}{" "}
                    —{" "}
                    <span className="text-slate-900">{data?.employee_id}</span>{" "}
                    •{" "}
                    <span className="text-slate-900">
                      {(data?.items || []).length}
                    </span>{" "}
                    snapshots
                  </span>
                )}
                {!showApiBar && noApi && (
                  <div className="text-rose-600 mt-1">
                    Error: API base URL is not set (VITE_API_BASE_URL)
                  </div>
                )}
              </div>

              {newest && (
                <div className="mt-4 w-full grid grid-cols-3 gap-3 max-w-[420px]">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className={UI.kpiTitle}>CPU</div>
                    <div className={UI.kpiValue}>
                      {newest.cpu_percent ?? "—"}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className={UI.kpiTitle}>RAM</div>
                    <div className={UI.kpiValue}>
                      {newest.memory_percent ?? "—"}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className={UI.kpiTitle}>Apps</div>
                    <div className={UI.kpiValue}>
                      {(newest.active_apps || []).length || "—"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Filters */}
            <div className="flex flex-col gap-3 lg:items-end">
              {/* Row 1: Employee ID + Limit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:w-full">
                <div className="flex flex-col">
                  <label className={UI.label}>Employee ID</label>
                  <input
                    ref={empInputRef}
                    className={UI.inputBase}
                    placeholder="YTP000007"
                    value={empId}
                    onChange={(e) => onEmpIdChange(e.target.value)}
                    onBlur={onEmpIdBlur}
                    onKeyDown={onKeyDown}
                  />
                </div>

                <div className="flex flex-col">
                  <label className={UI.label}>Limit</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    className={UI.inputBase}
                    value={limitLocal}
                    onChange={(e) =>
                      setLimitLocal(
                        Math.min(500, Math.max(1, Number(e.target.value) || 1))
                      )
                    }
                    onKeyDown={onKeyDown}
                    title="Number of snapshots"
                  />
                </div>
              </div>

              {/* Row 2: Since + Until (typing + calendar button) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:w-full">
                <DatetimeField
                  label="Since (UTC)"
                  inputRef={sinceRef}
                  value={sinceLocal}
                  onKeyDown={onKeyDown}
                  onChange={(e) =>
                    setSinceLocal(normalizeYMDHM(e.target.value))
                  }
                  onBlur={(e) =>
                    setSinceLocal(
                      normalizeYMDHM(toDatetimeLocal(e.target.value))
                    )
                  }
                />
                <DatetimeField
                  label="Until (UTC)"
                  inputRef={untilRef}
                  value={untilLocal}
                  onKeyDown={onKeyDown}
                  onChange={(e) =>
                    setUntilLocal(normalizeYMDHM(e.target.value))
                  }
                  onBlur={(e) =>
                    setUntilLocal(
                      normalizeYMDHM(toDatetimeLocal(e.target.value))
                    )
                  }
                />
              </div>

              {/* Row 3: Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:w-full">
                <button
                  onClick={onFetch}
                  className={`${UI.btnPrimary} w-full`}
                  title="Fetch (Enter or Ctrl/Cmd+Enter)"
                >
                  Fetch
                </button>

                <button
                  onClick={() => setShowApiBar((v) => !v)}
                  className={`${UI.btnSecondary} w-full`}
                  title="Change API Base"
                >
                  {showApiBar ? "Hide API" : "Change API"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={UI.card}>
          <div className="p-4">
            <div className="text-sm font-semibold text-slate-900 mb-2">
              Latest Snapshot
            </div>
            {status === "loading" ? (
              <div className="h-6 w-full bg-slate-100 animate-pulse rounded" />
            ) : newest ? (
              <div className="space-y-2 text-slate-700">
                <div className="text-[13px]">
                  at{" "}
                  <span className="font-mono text-slate-900">
                    {newest.monitored_at_utc}
                  </span>
                </div>
                <div>
                  CPU:{" "}
                  <span className="font-semibold text-slate-900">
                    {newest.cpu_percent ?? "—"}%
                  </span>
                </div>
                <div>
                  RAM:{" "}
                  <span className="font-semibold text-slate-900">
                    {newest.memory_percent ?? "—"}%
                  </span>
                </div>

                <div className="mt-2">
                  <div className={`${UI.label} mb-1`}>Active Apps</div>
                  <div className="flex flex-wrap gap-2">
                    {(newest.active_apps || []).length ? (
                      newest.active_apps.map((a) => (
                        <span key={a} className={UI.chip}>
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-sm">None</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No data</div>
            )}
          </div>
        </div>

        {/* Top Apps */}
        <div className={UI.card}>
          <div className="p-4">
            <div className="text-sm font-semibold text-slate-900 mb-2">
              Top Apps (count)
            </div>
            {aggApps.length ? (
              <div className="space-y-2">
                {aggApps.map(([name, cnt]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className={UI.chip}>{name}</span>
                    <span className="text-slate-600 text-sm">× {cnt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No apps</div>
            )}
          </div>
        </div>

        {/* Top Sites */}
        <div className={UI.card}>
          <div className="p-4">
            <div className="text-sm font-semibold text-slate-900 mb-2">
              Top Sites (count)
            </div>
            {aggSites.length ? (
              <div className="space-y-2">
                {aggSites.map(([host, cnt]) => (
                  <div key={host} className="flex items-center gap-2">
                    <span className={UI.chip}>{host}</span>
                    <span className="text-slate-600 text-sm">× {cnt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No sites</div>
            )}
          </div>
        </div>
      </div>

      {/* Snapshot table */}
      <div className={UI.card}>
        <div className="p-4">
          <div className="text-sm font-semibold text-slate-900 mb-3">
            Snapshots
          </div>
          <div className="overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 sticky top-0">
                <tr className="[&>th]:py-2.5 [&>th]:px-3 text-left">
                  <th>Time (UTC)</th>
                  <th className="text-right">CPU%</th>
                  <th className="text-right">RAM%</th>
                  <th>Apps</th>
                  <th>Visited Sites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.length ? (
                  items.map((it, i) => (
                    <tr
                      key={it.id}
                      className={i % 2 ? "bg-white" : "bg-slate-50/60"}
                    >
                      <td className="py-2.5 px-3 text-slate-900 font-mono">
                        {it.monitored_at_utc}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900">
                        {it.cpu_percent ?? "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900">
                        {it.memory_percent ?? "—"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900">
                        {(it.active_apps || []).length ? (
                          it.active_apps.join(", ")
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900">
                        {(it.visited_sites || []).length ? (
                          <div className="space-y-1">
                            {it.visited_sites.map((s, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2"
                              >
                                <span className="text-slate-600">{s.host}</span>
                                {s.url ? (
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline decoration-slate-400 hover:decoration-slate-700 truncate"
                                    title={s.title}
                                  >
                                    {s.title}
                                  </a>
                                ) : (
                                  <span className="truncate">{s.title}</span>
                                )}
                                <span className="ml-auto text-xs text-slate-500">
                                  {s.visited_at
                                    ? new Date(s.visited_at).toLocaleString()
                                    : "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3 px-3 text-slate-600" colSpan={5}>
                      {status === "loading" ? "Loading…" : "No data"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonitoringViewer;
