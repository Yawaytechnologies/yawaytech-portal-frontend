import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoCloseSharp } from "react-icons/io5";
import { MdAdd } from "react-icons/md";

import {
  fetchShiftTypes,
  addShiftType,
} from "../redux/actions/shiftTypeActions";
import { clearShiftTypeMessages } from "../redux/reducer/shiftTypeSlice";

const SHIFT_PRESETS = {
  Day: {
    start_time: "09:00",
    end_time: "18:00",
  },
  Afternoon: {
    start_time: "14:00",
    end_time: "22:00",
  },
  Night: {
    start_time: "22:00",
    end_time: "06:00",
  },
};

const SHIFT_TYPES = ["Day", "Afternoon", "Night"];

function hhmmToApiTime(hhmm) {
  if (!hhmm || !hhmm.includes(":")) return "00:00:00";

  const [h, m] = hhmm.split(":");

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function calcHours(startHHMM, endHHMM) {
  if (!startHHMM || !endHHMM) return 0;

  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);

  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  let diff = end - start;

  if (diff < 0) {
    diff += 24 * 60;
  }

  return Math.round((diff / 60) * 100) / 100;
}

function shortTime(t) {
  if (!t) return "-";

  const value = String(t);
  const match = value.match(/^(\d{2}):(\d{2})/);

  return match ? `${match[1]}:${match[2]}` : value;
}

function getShiftValue(item) {
  if (SHIFT_TYPES.includes(item?.shift)) return item.shift;

  if (item?.is_night === true) return "Night";

  const start = shortTime(item?.start_time);
  const end = shortTime(item?.end_time);

  if (start === "14:00" && end === "22:00") return "Afternoon";
  if (start === "22:00" && end === "06:00") return "Night";

  return "Day";
}

function getShiftBadgeClass(shift) {
  if (shift === "Night") {
    return "border border-amber-400/20 bg-amber-500/15 text-amber-200";
  }

  if (shift === "Afternoon") {
    return "border border-sky-400/20 bg-sky-500/15 text-sky-200";
  }

  return "border border-emerald-400/20 bg-emerald-500/15 text-emerald-200";
}

function getShiftFieldClass(shift) {
  if (shift === "Night") {
    return "border-amber-400/30 bg-amber-500/10 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20";
  }

  if (shift === "Afternoon") {
    return "border-sky-400/30 bg-sky-500/10 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";
  }

  return "border-emerald-400/30 bg-emerald-500/10 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20";
}

const INITIAL_FORM = {
  name: "",
  start_time: "09:00",
  end_time: "18:00",
  total_hours: 9,
  shift: "Day",
};

export default function ShiftType() {
  const dispatch = useDispatch();
  const fetchedRef = useRef(false);

  const {
    items = [],
    loading,
    creating,
    success,
    error,
  } = useSelector((state) => state.shiftType || {});

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitLocked, setSubmitLocked] = useState(false);

  useEffect(() => {
    if (fetchedRef.current) return;

    fetchedRef.current = true;
    dispatch(fetchShiftTypes());
  }, [dispatch]);

  useEffect(() => {
    if (!success) return;

    setOpen(false);
    setForm(INITIAL_FORM);
    setSubmitLocked(false);

    const timer = setTimeout(() => {
      dispatch(clearShiftTypeMessages());
    }, 1000);

    return () => clearTimeout(timer);
  }, [success, dispatch]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    if (!search) return items;

    return items.filter((item) => {
      const name = String(item?.name || "").toLowerCase();
      const id = String(item?.id || "").toLowerCase();
      const shift = String(getShiftValue(item) || "").toLowerCase();

      return (
        name.includes(search) || id.includes(search) || shift.includes(search)
      );
    });
  }, [items, q]);

  const updateTimeAndHours = (field, value) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      next.total_hours = calcHours(next.start_time, next.end_time);

      return next;
    });
  };

  const handleShiftChange = (shift) => {
    const preset = SHIFT_PRESETS[shift] || SHIFT_PRESETS.Day;

    setForm((prev) => ({
      ...prev,
      shift,
      start_time: preset.start_time,
      end_time: preset.end_time,
      total_hours: calcHours(preset.start_time, preset.end_time),
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (submitLocked || creating) return;

    dispatch(clearShiftTypeMessages());

    const shiftName = form.name.trim();

    if (!shiftName) {
      alert("Shift name is required");
      return;
    }

    if (!form.start_time || !form.end_time) {
      alert("Start time and end time are required");
      return;
    }

    if (!SHIFT_TYPES.includes(form.shift)) {
      alert("Shift type must be Day, Afternoon, or Night");
      return;
    }

    const alreadyExists = items.some(
      (item) =>
        String(item?.name || "")
          .trim()
          .toLowerCase() === shiftName.toLowerCase(),
    );

    if (alreadyExists) {
      alert("This shift name already exists. Use another shift name.");
      return;
    }

    const totalHours = calcHours(form.start_time, form.end_time);

    const payload = {
      name: shiftName,
      start_time: hhmmToApiTime(form.start_time),
      end_time: hhmmToApiTime(form.end_time),
      total_hours: Number(totalHours),
      shift: form.shift,
    };

    console.log("SHIFT POST PAYLOAD:", payload);

    setSubmitLocked(true);

    try {
      await dispatch(addShiftType(payload)).unwrap();
    } catch (err) {
      console.error("SHIFT CREATE FAILED:", err);
      setSubmitLocked(false);
    }
  };

  return (
    <div data-shift-page className="min-h-screen w-full p-0 text-white">
      <style>{`
        [data-shift-page] input.time-white::-webkit-calendar-picker-indicator {
          filter: invert(1) brightness(1.15);
          opacity: 1;
          cursor: pointer;
        }

        [data-shift-page] select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }

        [data-shift-page] select option {
          background: #0f172a;
          color: #ffffff;
        }
      `}</style>

      <div className="mx-auto w-full max-w-[2600px] 2xl:max-w-[2800px]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1830] via-[#17264f] to-[#24386e] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="border-b border-white/10 px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-7 2xl:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold leading-none tracking-wide sm:text-3xl xl:text-4xl 2xl:text-5xl">
                  Shift Types
                </h1>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
                <div className="w-full sm:w-[240px] md:w-[280px] lg:w-[320px] xl:w-[360px] 2xl:w-[400px]">
                  <div className="flex h-10 w-full items-center rounded-xl border border-white/10 bg-white/5 px-3 sm:h-11 md:h-12 md:px-4">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search shift name, id, or shift type..."
                      className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-white/40 sm:text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    dispatch(clearShiftTypeMessages());
                    setForm(INITIAL_FORM);
                    setSubmitLocked(false);
                    setOpen(true);
                  }}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FF5800] px-3 text-xs font-bold hover:brightness-110 sm:h-11 sm:px-4 sm:text-sm md:h-12 md:px-5"
                  type="button"
                >
                  <MdAdd className="text-base sm:text-lg" />
                  Add Shift
                </button>
              </div>
            </div>
          </div>

          {success && (
            <div className="border-b border-white/10 px-4 py-3 sm:px-5 md:px-6 lg:px-7 2xl:px-8">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 2xl:text-base">
                {String(success)}
              </div>
            </div>
          )}

          {error && (
            <div className="border-b border-white/10 px-4 py-3 sm:px-5 md:px-6 lg:px-7 2xl:px-8">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 2xl:text-base">
                {String(error)}
              </div>
            </div>
          )}

          <div className="px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-5 2xl:px-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-4 py-3 sm:px-5 2xl:px-6">
                <h2 className="p-0 text-sm font-semibold text-white/80 sm:text-base xl:text-lg">
                  Shift List
                </h2>
              </div>

              {loading ? (
                <div className="px-4 py-8 text-sm text-white/70 sm:px-5 sm:text-base 2xl:px-6 2xl:text-lg">
                  Loading shifts...
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-8 text-sm text-white/60 sm:px-5 sm:text-base 2xl:px-6 2xl:text-lg">
                  No shifts found.
                </div>
              ) : (
                <>
                  <div className="block md:hidden">
                    <div className="space-y-3 p-3 sm:p-4">
                      {filtered.map((item) => {
                        const shiftValue = getShiftValue(item);

                        return (
                          <div
                            key={
                              item?.id ||
                              `${item?.name}-${item?.start_time}-${item?.end_time}`
                            }
                            className="rounded-2xl border border-white/10 bg-white/5 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-base font-bold text-white">
                                  {item?.name || "-"}
                                </h3>

                                <p className="mt-1 text-xs text-white/60">
                                  ID: {item?.id ?? "-"}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${getShiftBadgeClass(
                                  shiftValue,
                                )}`}
                              >
                                {shiftValue}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                              <div className="rounded-xl bg-white/5 px-3 py-2">
                                <p className="text-[11px] text-white/50">
                                  Start
                                </p>
                                <p className="mt-1 font-semibold text-white/90">
                                  {shortTime(item?.start_time)}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white/5 px-3 py-2">
                                <p className="text-[11px] text-white/50">End</p>
                                <p className="mt-1 font-semibold text-white/90">
                                  {shortTime(item?.end_time)}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white/5 px-3 py-2">
                                <p className="text-[11px] text-white/50">
                                  Total Hours
                                </p>
                                <p className="mt-1 font-semibold text-white/90">
                                  {item?.total_hours ?? 0}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white/5 px-3 py-2">
                                <p className="text-[11px] text-white/50">
                                  Shift Type
                                </p>
                                <p className="mt-1 font-semibold text-white/90">
                                  {shiftValue}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-full">
                      <thead className="bg-transparent">
                        <tr className="text-left text-sm text-white/80 2xl:text-base">
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            ID
                          </th>
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Name
                          </th>
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Start
                          </th>
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            End
                          </th>
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Hours
                          </th>
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Shift Type
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filtered.map((item) => {
                          const shiftValue = getShiftValue(item);

                          return (
                            <tr
                              key={
                                item?.id ||
                                `${item?.name}-${item?.start_time}-${item?.end_time}`
                              }
                              className="border-t border-white/10 text-sm text-white/85 transition-colors hover:bg-white/[0.04] 2xl:text-base"
                            >
                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                {item?.id ?? "-"}
                              </td>

                              <td className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                                {item?.name || "-"}
                              </td>

                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                {shortTime(item?.start_time)}
                              </td>

                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                {shortTime(item?.end_time)}
                              </td>

                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                {item?.total_hours ?? 0}
                              </td>

                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold 2xl:text-sm ${getShiftBadgeClass(
                                    shiftValue,
                                  )}`}
                                >
                                  {shiftValue}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-[2px] sm:items-center sm:p-4 md:p-6 lg:p-8 md:pl-[290px] lg:pl-[280px]"
          onMouseDown={() => {
            if (!creating && !submitLocked) setOpen(false);
          }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="flex w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0d1831] text-sm shadow-2xl sm:max-w-md sm:rounded-2xl md:max-w-lg lg:max-w-lg xl:max-w-xl"
            style={{ maxHeight: "92dvh" }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5 md:px-6 2xl:px-7">
              <div>
                <h2 className="text-lg font-extrabold sm:text-xl 2xl:text-2xl">
                  Create Shift Type
                </h2>
              </div>

              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 2xl:h-12 2xl:w-12"
                onClick={() => setOpen(false)}
                disabled={creating || submitLocked}
                type="button"
              >
                <IoCloseSharp className="text-xl 2xl:text-2xl" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 md:px-6 2xl:px-7">
                <div className="grid grid-cols-1 gap-4 md:gap-5 2xl:gap-6">
                  <div>
                    <label className="text-sm font-medium text-white/80 2xl:text-base">
                      Shift Name
                    </label>

                    <input
                      type="text"
                      value={form.name}
                      disabled={creating || submitLocked}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter shift name"
                      className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none placeholder:text-white/35 focus:border-[#FF5800]/50 focus:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 2xl:h-14 2xl:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 2xl:gap-6">
                    <div>
                      <label className="text-sm font-medium text-white/80 2xl:text-base">
                        Start Time
                      </label>

                      <input
                        type="time"
                        step="60"
                        value={form.start_time}
                        disabled={creating || submitLocked}
                        onChange={(e) =>
                          updateTimeAndHours("start_time", e.target.value)
                        }
                        className="time-white mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none focus:border-[#FF5800]/50 focus:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 2xl:h-14 2xl:text-base"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-white/80 2xl:text-base">
                        End Time
                      </label>

                      <input
                        type="time"
                        step="60"
                        value={form.end_time}
                        disabled={creating || submitLocked}
                        onChange={(e) =>
                          updateTimeAndHours("end_time", e.target.value)
                        }
                        className="time-white mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none focus:border-[#FF5800]/50 focus:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 2xl:h-14 2xl:text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 2xl:gap-6">
                    <div>
                      <label className="text-sm font-medium text-white/80 2xl:text-base">
                        Total Hours
                      </label>

                      <input
                        type="number"
                        value={form.total_hours}
                        readOnly
                        className="mt-2 h-11 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white/80 outline-none sm:h-12 2xl:h-14 2xl:text-base"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-white/80 2xl:text-base">
                        Shift Type
                      </label>

                      <div className="relative mt-2">
                        <select
                          value={form.shift}
                          disabled={creating || submitLocked}
                          onChange={(e) => handleShiftChange(e.target.value)}
                          className={`h-11 w-full rounded-xl border px-4 pr-12 text-sm font-semibold text-white outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 2xl:h-14 2xl:text-base shadow-[0_8px_20px_rgba(0,0,0,0.18)] ${getShiftFieldClass(
                            form.shift,
                          )}`}
                        >
                          <option value="Day">Day</option>
                          <option value="Afternoon">Afternoon</option>
                          <option value="Night">Night</option>
                        </select>

                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                          <svg
                            className="h-4 w-4 text-white/80"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                      {String(error)}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 bg-[#0d1831] px-4 py-4 sm:px-5 md:px-6 2xl:px-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="submit"
                    disabled={creating || submitLocked}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#FF5800] px-5 text-sm font-extrabold hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:min-w-[150px] 2xl:h-14 2xl:text-base"
                  >
                    {creating || submitLocked ? "Saving..." : "Save Shift"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
