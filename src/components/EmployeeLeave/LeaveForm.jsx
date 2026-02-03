// src/components/EmployeeLeave/LeaveForm.jsx
import React, { useMemo, useState, useEffect, useRef, Fragment } from "react";
import dayjs from "dayjs";
import { Listbox } from "@headlessui/react";
import { AnimatePresence, motion as Motion } from "framer-motion";

/* ───────── styles & utils ───────── */
const CTRL =
  "h-[32px] w-full rounded-md px-2.5 bg-white text-[12px] text-slate-800 " +
  "border border-slate-200 shadow-sm outline-none leading-none " +
  "focus:ring-0 focus:border-slate-300 flex items-center";

const CTRL_INPUT =
  CTRL +
  " appearance-none [appearance:none] focus:ring-0 focus:border-slate-300 " +
  "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const CTRL_FILE =
  CTRL_INPUT +
  " file:h-full file:py-0 file:px-2.5 file:rounded-md file:border-0 " +
  "file:bg-slate-100 file:text-[11px] file:text-slate-700 file:leading-none";

const cx = (...cls) => cls.filter(Boolean).join(" ");
const EASE = [0.22, 1, 0.36, 1];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* ───────── clicks/escape outside ───────── */
function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, onClose]);
}

/* ───────── SmoothSelect ───────── */
function SmoothSelect({
  value,
  onChange,
  options,
  placeholder = "Select... ",
  onOpenRequest,
}) {
  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="relative">
          <Listbox.Button
            className={cx(CTRL, "justify-between text-left")}
            onClick={() => onOpenRequest?.()}
          >
            <span className={!value ? "text-slate-400" : ""}>
              {options.find((o) => o.value === value)?.label || placeholder}
            </span>
          </Listbox.Button>

          <AnimatePresence>
            {open && options.length > 0 && (
              <Listbox.Options as={Fragment}>
                <Motion.ul
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: EASE }}
                  className="absolute z-[100] mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black/5 overflow-hidden"
                >
                  {options.map((opt) => (
                    <Listbox.Option
                      key={opt.value}
                      value={opt.value}
                      className={({ active, selected }) =>
                        cx(
                          "px-2.5 py-1.5 cursor-pointer text-[12px]",
                          active && "bg-slate-50",
                          selected
                            ? "font-medium text-indigo-700"
                            : "text-slate-700",
                        )
                      }
                    >
                      {opt.label}
                    </Listbox.Option>
                  ))}
                </Motion.ul>
              </Listbox.Options>
            )}
          </AnimatePresence>
        </div>
      )}
    </Listbox>
  );
}

/* ───────── Popover Calendar (extra-compact) ───────── */
function CalendarPopover({ value, onChange, minDate, maxDate, onClose }) {
  const parsed = dayjs(value || dayjs().format("YYYY-MM-DD"));
  const [cursor, setCursor] = useState(parsed.isValid() ? parsed : dayjs());

  const [manual, setManual] = useState(
    parsed.isValid() ? parsed.format("YYYY-MM-DD") : "",
  );
  const [invalid, setInvalid] = useState(false);

  const start = cursor.startOf("month").startOf("week");
  const end = cursor.endOf("month").endOf("week");

  const weeks = [];
  let d = start.clone();
  while (d.isBefore(end) || d.isSame(end, "day")) {
    const row = [];
    for (let i = 0; i < 7; i++) {
      row.push(d);
      d = d.add(1, "day");
    }
    weeks.push(row);
  }

  const outOfRange = (dt) => {
    if (minDate && dt.isBefore(minDate, "day")) return true;
    if (maxDate && dt.isAfter(maxDate, "day")) return true;
    return false;
  };

  const sanitizeYMD = (raw) => {
    const v = String(raw || "")
      .replace(/[^\d]/g, "")
      .slice(0, 8);
    const y = v.slice(0, 4);
    const m = v.slice(4, 6);
    const dd = v.slice(6, 8);
    return y + (m ? "-" + m : "") + (dd ? "-" + dd : "");
  };

  const applyManual = () => {
    const dt = dayjs(manual, ["YYYY-MM-DD", "DD/MM/YYYY", "DD-MM-YYYY"], true);
    if (!dt.isValid() || outOfRange(dt)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onChange?.(dt.format("YYYY-MM-DD"));
    onClose?.();
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 6, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.16, ease: EASE }}
      className="absolute z-[120] mt-1 w-[210px] rounded-md bg-white shadow-xl ring-1 ring-black/5 p-1"
    >
      <div className="flex items-center justify-between px-1 pb-0.5">
        <button
          type="button"
          className="p-0.5 rounded hover:bg-slate-100"
          onClick={() => setCursor((c) => c.subtract(1, "month"))}
          aria-label="Prev"
        >
          ‹
        </button>
        <div className="text-[11px] font-medium text-slate-800">
          {cursor.format("MMMM YYYY")}
        </div>
        <button
          type="button"
          className="p-0.5 rounded hover:bg-slate-100"
          onClick={() => setCursor((c) => c.add(1, "month"))}
          aria-label="Next"
        >
          ›
        </button>
      </div>

      <div className="flex items-center gap-1 px-1 pb-0.5">
        <input
          value={manual}
          onChange={(e) => {
            setManual(sanitizeYMD(e.target.value));
            if (invalid) setInvalid(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && applyManual()}
          placeholder="YYYY-MM-DD"
          inputMode="numeric"
          className={cx(
            "flex-1 h-[24px] px-2 text-[11px] border rounded-md outline-none",
            invalid ? "border-red-500" : "border-slate-200",
            "focus:ring-0 focus:border-slate-300",
          )}
        />
        <button
          type="button"
          onClick={applyManual}
          className="h-[24px] px-2 rounded-md bg-indigo-600 text-white text-[11px] hover:bg-indigo-700"
        >
          Set
        </button>
      </div>

      <div className="grid grid-cols-7 gap-[1px] px-1 text-[9px] text-slate-500">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((wd) => (
          <div key={wd} className="text-center py-0.5">
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[1px] px-1 pt-0.5">
        {weeks.map((row, i) => (
          <Fragment key={i}>
            {row.map((dt) => {
              const sel = value && dayjs(value).isSame(dt, "day");
              const out = !dt.isSame(cursor, "month");
              const today = dt.isSame(dayjs(), "day");
              const disabled = outOfRange(dt);
              return (
                <button
                  key={dt.format("YYYY-MM-DD")}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const v = dt.format("YYYY-MM-DD");
                    onChange?.(v);
                    onClose?.();
                  }}
                  className={cx(
                    "h-6 rounded-md text-[10px] leading-none flex items-center justify-center transition",
                    disabled && "opacity-30 cursor-not-allowed",
                    sel
                      ? "bg-indigo-600 text-white"
                      : today
                        ? "ring-1 ring-indigo-500/50"
                        : "hover:bg-slate-100",
                    out && !sel && "text-slate-400",
                  )}
                >
                  {dt.date()}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      <div className="flex items-center justify-between mt-1 px-1">
        <button
          type="button"
          className="text-[10px] px-1.5 py-0.5 rounded hover:bg-slate-100"
          onClick={() => {
            const t = dayjs();
            setCursor(t);
            setManual(t.format("YYYY-MM-DD"));
          }}
        >
          Today
        </button>
        <button
          type="button"
          className="text-[10px] px-1.5 py-0.5 rounded hover:bg-slate-100"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Motion.div>
  );
}

/* ───────── DateButton ───────── */
function DateButton({ label, value, onChange, min, max, error }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  useOutsideClose(boxRef, () => setOpen(false));

  const fmtDisplay = (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "");
  const [text, setText] = useState(fmtDisplay(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(fmtDisplay(value));
    setInvalid(false);
  }, [value]);

  const sanitizeDMY = (raw) => {
    const v = String(raw || "")
      .replace(/[^\d]/g, "")
      .slice(0, 8);
    const dd = v.slice(0, 2);
    const mm = v.slice(2, 4);
    const yyyy = v.slice(4, 8);
    return dd + (mm ? "/" + mm : "") + (yyyy ? "/" + yyyy : "");
  };

  const parseAndApply = () => {
    if (!text) return;
    if (text.length !== 10) {
      setInvalid(true);
      return;
    }
    const dt = dayjs(text, ["DD/MM/YYYY"], true);
    if (!dt.isValid()) {
      setInvalid(true);
      return;
    }

    let out = dt;
    if (min && out.isBefore(min, "day")) out = dayjs(min);
    if (max && out.isAfter(max, "day")) out = dayjs(max);

    setInvalid(false);
    onChange?.(out.format("YYYY-MM-DD"));
    setText(out.format("DD/MM/YYYY"));
  };

  return (
    <div className="flex flex-col gap-1 relative" ref={boxRef}>
      {label && <label className="text-[11px] text-slate-600">{label}</label>}

      <div className="relative">
        <input
          value={text}
          onChange={(e) => {
            setText(sanitizeDMY(e.target.value));
            if (invalid) setInvalid(false);
          }}
          onBlur={parseAndApply}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "ArrowDown") setOpen(true);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="DD/MM/YYYY"
          inputMode="numeric"
          aria-invalid={invalid || !!error}
          className={cx(
            CTRL_INPUT,
            "pr-9",
            (error || invalid) && "border-red-500",
          )}
        />
        <button
          type="button"
          aria-label="Open calendar"
          onClick={() => setOpen((v) => !v)}
          className="absolute right-2 inset-y-0 my-auto h-6 w-6 rounded-md text-slate-500 hover:bg-slate-100 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <div className="absolute left-0 top-[48px] z-[120]">
            <CalendarPopover
              value={value}
              onChange={(v) => {
                onChange?.(v);
                setText(dayjs(v).format("DD/MM/YYYY"));
                setInvalid(false);
                setOpen(false);
              }}
              minDate={min ? dayjs(min) : undefined}
              maxDate={max ? dayjs(max) : undefined}
              onClose={() => setOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {(error || invalid) && (
        <p className="text-[11px] text-red-600">
          {error || "Enter a valid date (DD/MM/YYYY)."}
        </p>
      )}
    </div>
  );
}

/* ───────── Time inputs ───────── */
const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
  const hh = String(Math.floor(i / 4)).padStart(2, "0");
  const mm = String((i % 4) * 15).padStart(2, "0");
  return `${hh}:${mm}`;
});

function TimeMenu({ value, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const filtered = timeOptions.filter((t) => t.includes(q));
  return (
    <Motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 6, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.16, ease: EASE }}
      className="absolute z-[120] mt-1 w-[210px] rounded-md bg-white shadow-xl ring-1 ring-black/5 p-2"
    >
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search time…"
        className="w-full mb-2 px-2.5 py-1.5 text-[12px] border border-slate-200 rounded-md outline-none focus:ring-0 focus:border-slate-300"
      />
      <div className="max-h-52 overflow-auto rounded-md">
        {filtered.map((t) => {
          const sel = value === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => {
                onSelect?.(t);
                onClose?.();
              }}
              className={cx(
                "w-full text-left px-2.5 py-1.5 text-[12px] rounded-md hover:bg-slate-100",
                sel && "bg-indigo-600 text-white hover:bg-indigo-600",
              )}
            >
              {t}
            </button>
          );
        })}
      </div>
      <div className="flex justify-end mt-2">
        <button
          onClick={onClose}
          className="text-[11px] px-2 py-1 rounded hover:bg-slate-100"
        >
          Close
        </button>
      </div>
    </Motion.div>
  );
}

function TimeField({ label, value, onChange, placeholder = "HH:MM", error }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  useOutsideClose(boxRef, () => setOpen(false));

  const normalize = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";
    const parts = s.split(":");
    let h = parseInt(parts[0] || "0", 10);
    let m = parseInt((parts[1] || "0").slice(0, 2), 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return value || "";
    h = clamp(h, 0, 23);
    m = clamp(m, 0, 59);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-1 relative" ref={boxRef}>
      {label && <label className="text-[11px] text-slate-600">{label}</label>}
      <div className="relative">
        <input
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={(e) => onChange?.(normalize(e.target.value))}
          placeholder={placeholder}
          className={cx(CTRL_INPUT, "pr-16", error && "border-red-500")}
        />
        <div className="absolute right-1 inset-y-0 my-auto flex items-center gap-1">
          <button
            type="button"
            className="h-6 w-6 rounded-md text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            onClick={() => {
              const norm = normalize(value || "00:00");
              const d = dayjs(`2000-01-01T${norm}`);
              onChange?.(d.subtract(15, "minute").format("HH:mm"));
            }}
            aria-label="Minus 15 minutes"
          >
            –
          </button>
          <button
            type="button"
            className="h-6 w-6 rounded-md text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open time menu"
          >
            ⋯
          </button>
          <button
            type="button"
            className="h-6 w-6 rounded-md text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            onClick={() => {
              const norm = normalize(value || "00:00");
              const d = dayjs(`2000-01-01T${norm}`);
              onChange?.(d.add(15, "minute").format("HH:mm"));
            }}
            aria-label="Plus 15 minutes"
          >
            +
          </button>
        </div>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <AnimatePresence>
        {open && (
          <div className="absolute left-0 top-[48px] z-[120]">
            <TimeMenu
              value={value}
              onSelect={onChange}
              onClose={() => setOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────── Default type data (fallback if API fails) ───────── */

const BACKEND_TO_UI = {
  CGR: "PR", // map your permission code -> PR
};

const PERMISSION_CHOICES = [
  { value: "FIRST", label: "First Half" },
  { value: "SECOND", label: "Second Half" },
  { value: "TIME", label: "Select Time" },
];

const PERMISSION_REASONS = [
  { value: "LATE", label: "Late login" },
  { value: "EARLY", label: "Early logout" },
  { value: "OTHER", label: "Other" },
];

const daysBetween = (from, to) => {
  if (!from || !to) return 0;
  const a = dayjs(from).startOf("day");
  const b = dayjs(to).startOf("day");
  return Math.max(b.diff(a, "day") + 1, 0);
};

/* ───────── Component ───────── */
/**
 * Props:
 * - onSubmit(rec)
 * - onCancel()
 * - leaveTypes        // from API GET /api/leave/types
 * - leaveTypesStatus  // "idle" | "loading" | "succeeded" | "failed"
 * - submitting        // true while POST /api/leave/apply running
 * - error             // any error message from apply API
 */
export default function LeaveForm({
  onSubmit,
  onCancel,
  leaveTypes = [],
  leaveTypesStatus = "idle",
  submitting = false,
  error = null,
  onNeedTypes,
  onClearError,
}) {
  const typeOptions = useMemo(() => {
    console.log("LeaveForm -> leaveTypes prop =", leaveTypes);

    let arr = [];

    if (Array.isArray(leaveTypes)) {
      arr = leaveTypes;
    } else if (leaveTypes && typeof leaveTypes === "object") {
      if (Array.isArray(leaveTypes.items)) arr = leaveTypes.items;
      else if (Array.isArray(leaveTypes.data)) arr = leaveTypes.data;
      else if (Array.isArray(leaveTypes.results)) arr = leaveTypes.results;
      else {
        const firstArray = Object.values(leaveTypes).find((v) =>
          Array.isArray(v),
        );
        if (firstArray) arr = firstArray;
      }
    }

    if (!arr || arr.length === 0) {
      console.log("LeaveForm -> resolved types array is EMPTY =", arr);
      return [];
    }

    return arr.map((t) => {
      const rawCode = String(t.code || "").toUpperCase(); // CGR / CL / EL / LL / SL
      const uiCode = BACKEND_TO_UI[rawCode] || rawCode; // CGR -> PR, others same

      const backendName =
        (t.name && String(t.name).trim()) ||
        (t.label && String(t.label).trim()) ||
        rawCode;

      return {
        value: uiCode, // PR / CL / EL / LL / SL
        backendCode: rawCode,
        backendName,
        label: `${uiCode} — ${backendName}`,
      };
    });
  }, [leaveTypes]);

  const [type, setType] = useState("");

  useEffect(() => {
    if (typeOptions.length === 0) return;
    if (!type) setType(typeOptions[0].value);
  }, [typeOptions, type]);

  useEffect(() => {
    if (typeOptions.length === 0) return;
    const exists = typeOptions.some((o) => o.value === type);
    if (!exists) {
      setType(typeOptions[0].value);
    }
  }, [typeOptions, type]);

  const selectedType = typeOptions.find((o) => o.value === type) || null;
  const isPermission = type === "PR";

  // full-day leave
  const [from, setFrom] = useState(dayjs().format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));

  // permission canonical values
  const [permChoice, setPermChoice] = useState("FIRST");
  const [permDate, setPermDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [permFrom, setPermFrom] = useState("09:00");
  const [permTo, setPermTo] = useState("13:00");

  // temp values for popup
  const [tempPermDate, setTempPermDate] = useState(permDate);
  const [tempPermFrom, setTempPermFrom] = useState(permFrom);
  const [tempPermTo, setTempPermTo] = useState(permTo);

  const [timeWindowOpen, setTimeWindowOpen] = useState(false);

  // reason + file
  const [permReasonCode, setPermReasonCode] = useState("LATE");
  const [permOtherText, setPermOtherText] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);

  const [errors, setErrors] = useState({});

  const totalDays = useMemo(
    () => (isPermission ? 0 : daysBetween(from, to)),
    [isPermission, from, to],
  );

  const permMinutes = useMemo(() => {
    if (!isPermission) return 0;
    const start = dayjs(`2000-01-01T${permFrom}`);
    const end = dayjs(`2000-01-01T${permTo}`);
    return Math.max(end.diff(start, "minute"), 0);
  }, [isPermission, permFrom, permTo]);

  const tempMinutes = useMemo(() => {
    const start = dayjs(`2000-01-01T${tempPermFrom}`);
    const end = dayjs(`2000-01-01T${tempPermTo}`);
    return Math.max(end.diff(start, "minute"), 0);
  }, [tempPermFrom, tempPermTo]);

  const durationChange = (v) => {
    setPermChoice(v);
    if (v === "TIME") {
      setTimeWindowOpen(true);
    }
  };

  useEffect(() => {
    if (!isPermission) return;
    if (permChoice === "FIRST") {
      setPermFrom("09:00");
      setPermTo("13:00");
    } else if (permChoice === "SECOND") {
      setPermFrom("14:00");
      setPermTo("18:00");
    }
  }, [isPermission, permChoice]);

  useEffect(() => {
    if (!isPermission) {
      setPermChoice("FIRST");
      setPermReasonCode("LATE");
      setPermOtherText("");
      setTimeWindowOpen(false);
    }
  }, [isPermission]);

  useEffect(() => {
    if (timeWindowOpen) {
      setTempPermDate(permDate);
      setTempPermFrom(permFrom);
      setTempPermTo(permTo);
    }
  }, [timeWindowOpen, permDate, permFrom, permTo]);

  const validate = () => {
    const e = {};

    if (isPermission) {
      if (!permDate || !dayjs(permDate, "YYYY-MM-DD", true).isValid()) {
        e.permDate = "Pick a valid permission date.";
      }
      if (permMinutes <= 0) {
        e.permTo = "End time must be after start time.";
      }
      if (
        permReasonCode === "OTHER" &&
        (!permOtherText || permOtherText.trim().length < 5)
      ) {
        e.permOtherText = "Describe the reason (min 5 characters).";
      }
    } else {
      if (!from || !dayjs(from, "YYYY-MM-DD", true).isValid()) {
        e.from = "Pick a valid start date.";
      }
      if (!to || !dayjs(to, "YYYY-MM-DD", true).isValid()) {
        e.to = "Pick a valid end date.";
      }
      if (from && to && dayjs(to).isBefore(dayjs(from), "day")) {
        e.to = "End date must be on or after start date.";
      }
      if (!e.to && totalDays <= 0) {
        e.to = "Select at least one day of leave.";
      }
      if (!reason || reason.trim().length < 5) {
        e.reason = "Reason must be at least 5 characters.";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const backendType = selectedType?.backendCode || type;
    const backendName = selectedType?.backendName || "";

    if (isPermission) {
      const start_datetime = dayjs(`${permDate}T${permFrom}`).toISOString();
      const end_datetime = dayjs(`${permDate}T${permTo}`).toISOString();
      const requested_hours = Number((permMinutes / 60).toFixed(2));

      const permReasonText =
        permReasonCode === "OTHER"
          ? permOtherText.trim()
          : PERMISSION_REASONS.find((r) => r.value === permReasonCode)?.label ||
            permReasonCode;

      onSubmit?.({
        type: "PR", // UI canonical
        backendType, // e.g. CGR
        backendName,
        permissionMode: permChoice,
        date: permDate,
        timeFrom: permFrom,
        timeTo: permTo,
        minutes: permMinutes,
        reasonCode: permReasonCode,
        reasonText: permReasonCode === "OTHER" ? permOtherText.trim() : "",
        attachmentName: file?.name || "",
      });
      return;
    }

    const start_datetime = dayjs(from).startOf("day").toISOString();
    const end_datetime = dayjs(to).endOf("day").toISOString();
    const requested_hours = totalDays * 8;

    onSubmit?.({
      type,
      backendType,
      backendName,
      from,
      to,
      halfDay: "None",
      reason: reason.trim(),
      attachmentName: file?.name || "",
      days: totalDays,
    });
  };

  const handleCancel = () => {
    setPermChoice("FIRST");
    setPermDate(dayjs().format("YYYY-MM-DD"));
    setPermFrom("09:00");
    setPermTo("13:00");
    setPermReasonCode("LATE");
    setPermOtherText("");
    setFile(null);
    setErrors({});
    onCancel?.();
  };

  const isPermissionModeInvalid =
    isPermission &&
    (!permDate ||
      permMinutes <= 0 ||
      (permReasonCode === "OTHER" &&
        (!permOtherText || permOtherText.trim().length < 5)));

  const isLeaveModeInvalid =
    !isPermission &&
    (!from || !to || totalDays <= 0 || !reason || reason.trim().length < 5);

  const gridCols = isPermission ? "md:grid-cols-2" : "md:grid-cols-3";

  const disableSubmit =
    submitting ||
    leaveTypesStatus === "loading" ||
    (isPermission ? isPermissionModeInvalid : isLeaveModeInvalid);

  return (
    <>
      <form
        onSubmit={submit}
        noValidate
        className={cx("px-4 py-3 grid gap-3 items-start", gridCols)}
      >
        {/* Optional API error */}
        {error && (
          <div className="md:col-span-3 mb-1">
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
              {error}
            </p>
          </div>
        )}

        {/* Type */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-600">Type</label>
          <SmoothSelect
            value={type}
            onChange={(v) => {
              setType(v);
              setErrors((prev) => ({ ...prev, type: undefined }));
              onClearError?.(); // ✅ ADD
            }}
            options={typeOptions}
            placeholder={
              leaveTypesStatus === "loading" ? "Loading types..." : "Select..."
            }
            onOpenRequest={onNeedTypes}
          />

          {errors.type && (
            <p className="text-[11px] text-red-600">{errors.type}</p>
          )}
        </div>

        {/* Leave dates (EL/CL/SL/other full-day) */}
        {!isPermission && (
          <>
            <DateButton
              label="From"
              value={from}
              onChange={(v) => {
                setFrom(v);
                onClearError?.(); // ✅ ADD
              }}
              error={errors.from}
            />

            <DateButton
              label="To"
              value={to}
              onChange={(v) => {
                setTo(v);
                onClearError?.(); // ✅ ADD
              }}
              min={from}
              error={errors.to}
            />
          </>
        )}

        {/* Permission duration */}
        {isPermission && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-600">Duration</label>
            <SmoothSelect
              value={permChoice}
              onChange={durationChange}
              options={PERMISSION_CHOICES}
            />
          </div>
        )}

        {/* Reason */}
        <div className={cx(isPermission ? "md:col-span-2" : "md:col-span-3")}>
          <label className="mb-1 block text-[11px] text-slate-600">
            Reason
          </label>

          {isPermission ? (
            <>
              <SmoothSelect
                value={permReasonCode}
                onChange={setPermReasonCode}
                options={PERMISSION_REASONS}
                placeholder="Select reason"
              />
              {permReasonCode === "OTHER" && (
                <>
                  <textarea
                    rows={3}
                    className={cx(
                      "mt-2 w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[12px] outline-none focus:ring-0 focus:border-slate-300 shadow-sm",
                      errors.permOtherText && "border-red-500",
                    )}
                    placeholder="Describe the reason"
                    value={permOtherText}
                    onChange={(e) => setPermOtherText(e.target.value)}
                  />
                  {errors.permOtherText && (
                    <p className="text-[11px] text-red-600">
                      {errors.permOtherText}
                    </p>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <textarea
                rows={3}
                className={cx(
                  "w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[12px] outline-none focus:ring-0 focus:border-slate-300 shadow-sm",
                  errors.reason && "border-red-500",
                )}
                placeholder="A short note"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  onClearError?.(); // ✅ ADD
                }}
              />

              {errors.reason && (
                <p className="text-[11px] text-red-600">{errors.reason}</p>
              )}
            </>
          )}
        </div>

        {/* Attachment */}
        <div className="md:col-span-3">
          <label className="mb-1 block text-[11px] text-slate-600">
            Attachment (optional)
          </label>
          <div className="w-[220px]">
            <input
              type="file"
              className={CTRL_FILE}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className={cx(
            "flex items-center justify-between gap-2 flex-wrap mt-1",
            isPermission ? "md:col-span-2" : "md:col-span-3",
          )}
        >
          {isPermission ? (
            <div className="text-[11px] text-slate-600">
              Permission •{" "}
              <span className="font-medium">
                {dayjs(permDate).format("DD MMM YYYY")}
              </span>{" "}
              •{" "}
              <span className="font-medium">
                {permChoice === "FIRST"
                  ? "First Half (09:00–13:00)"
                  : permChoice === "SECOND"
                    ? "Second Half (14:00–18:00)"
                    : "Custom Time"}
              </span>{" "}
              {permChoice === "TIME" && (
                <>
                  • <span className="font-medium">{permFrom}</span> →{" "}
                  <span className="font-medium">{permTo}</span> •{" "}
                  <span className="font-medium">
                    {Math.floor(permMinutes / 60)}h {permMinutes % 60}m
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-slate-600">
              Total: <span className="font-medium">{totalDays || 0}</span>{" "}
              day(s)
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="h-[32px] px-3 rounded-md bg-slate-100 text-[12px] hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-[32px] px-3 rounded-md bg-indigo-600 text-white text-[12px] hover:bg-indigo-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={disableSubmit}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </form>

      {/* Permission popup (Date + Time) */}
      <AnimatePresence>
        {timeWindowOpen && (
          <Motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setTimeWindowOpen(false)}
            />
            <Motion.div
              initial={{ y: 18, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 10, scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE }}
              className="relative z-[210] w-[min(480px,95vw)] rounded-lg bg-white p-4 shadow-2xl"
            >
              <h3 className="text-sm font-semibold text-slate-800">
                Select Permission Date & Time
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Pick the date and a custom time window.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <DateButton
                    label="Date"
                    value={tempPermDate}
                    onChange={setTempPermDate}
                    error={errors.permDate}
                  />
                </div>
                <div className="sm:col-span-1">
                  <TimeField
                    label="From"
                    value={tempPermFrom}
                    onChange={setTempPermFrom}
                    error={errors.permFrom}
                  />
                </div>
                <div className="sm:col-span-1">
                  <TimeField
                    label="To"
                    value={tempPermTo}
                    onChange={setTempPermTo}
                    error={errors.permTo}
                  />
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-700">
                Duration:{" "}
                <span className="font-medium">
                  {Math.floor(tempMinutes / 60)}h {tempMinutes % 60}m
                </span>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="h-[30px] px-3 rounded-md bg-slate-100 text-[12px] hover:bg-slate-200"
                  onClick={() => setTimeWindowOpen(false)}
                >
                  Close
                </button>
                <button
                  className="h-[30px] px-3 rounded-md bg-indigo-600 text-white text-[12px] hover:bg-indigo-700 disabled:opacity-60"
                  onClick={() => {
                    setPermDate(tempPermDate);
                    setPermFrom(tempPermFrom);
                    setPermTo(tempPermTo);
                    setTimeWindowOpen(false);
                  }}
                  disabled={!tempPermDate || tempMinutes <= 0}
                >
                  Use Selection
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
