import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoCloseSharp } from "react-icons/io5";
import { MdAdd } from "react-icons/md";

import {
  fetchShiftTypes,
  addShiftType,
} from "../redux/actions/shiftTypeActions";
import { clearShiftTypeMessages } from "../redux/reducer/shiftTypeSlice";

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
  if (diff < 0) diff += 24 * 60;

  return Math.round((diff / 60) * 100) / 100;
}

function shortTime(t) {
  if (!t) return "-";
  const s = String(t);
  const m = s.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : s;
}

const INITIAL_FORM = {
  name: "",
  start_time: "09:00",
  end_time: "18:00",
  total_hours: 9,
  is_night: false,
};

export default function ShiftType() {
  const dispatch = useDispatch();
  const fetchedRef = useRef(false);

  const { items, loading, creating, success } = useSelector((s) => s.shiftType);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    dispatch(fetchShiftTypes());
  }, [dispatch]);

  useEffect(() => {
    if (!success) return;

    setOpen(false);
    setForm(INITIAL_FORM);

    const t = setTimeout(() => {
      dispatch(clearShiftTypeMessages());
    }, 1500);

    return () => clearTimeout(t);
  }, [success, dispatch]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;

    return items.filter((x) => {
      const name = String(x?.name || "").toLowerCase();
      const id = String(x?.id || "").toLowerCase();
      return name.includes(s) || id.includes(s);
    });
  }, [items, q]);

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(clearShiftTypeMessages());

    if (!form.name.trim()) {
      alert("Shift name is required");
      return;
    }

    if (!form.start_time || !form.end_time) {
      alert("Start time and end time are required");
      return;
    }

    const totalHours =
      form.total_hours === "" || form.total_hours === null
        ? calcHours(form.start_time, form.end_time)
        : Number(form.total_hours);

    const payload = {
      name: form.name.trim(),
      start_time: hhmmToApiTime(form.start_time),
      end_time: hhmmToApiTime(form.end_time),
      total_hours: Number.isFinite(totalHours) ? totalHours : 0,
      is_night: !!form.is_night,
    };

    dispatch(addShiftType(payload));
  };

  return (
    <div
      data-shift-page
      className="min-h-screen w-full px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 xl:px-5 2xl:px-6 text-white"
    >
      <style>{`
        [data-shift-page] input.time-white::-webkit-calendar-picker-indicator {
          filter: invert(1) brightness(1.15);
          opacity: 1;
          cursor: pointer;
        }
      `}</style>

      <div className="w-full max-w-none">
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
                      placeholder="Search shift name or id..."
                      className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-white/40 sm:text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    dispatch(clearShiftTypeMessages());
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

          <div className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-7 2xl:px-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-4 py-3 sm:px-5 2xl:px-6">
                <h2 className="text-sm font-semibold text-white/80 sm:text-base 2xl:text-lg">
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
                      {filtered.map((x) => (
                        <div
                          key={
                            x?.id ||
                            `${x?.name}-${x?.start_time}-${x?.end_time}`
                          }
                          className="rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-bold text-white">
                                {x?.name || "-"}
                              </h3>
                              <p className="mt-1 text-xs text-white/60">
                                ID: {x?.id ?? "-"}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                                x?.is_night
                                  ? "border border-amber-400/20 bg-amber-500/15 text-amber-200"
                                  : "border border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                              }`}
                            >
                              {x?.is_night ? "Night" : "Day"}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-white/5 px-3 py-2">
                              <p className="text-[11px] text-white/50">Start</p>
                              <p className="mt-1 font-semibold text-white/90">
                                {shortTime(x?.start_time)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white/5 px-3 py-2">
                              <p className="text-[11px] text-white/50">End</p>
                              <p className="mt-1 font-semibold text-white/90">
                                {shortTime(x?.end_time)}
                              </p>
                            </div>

                            <div className="col-span-2 rounded-xl bg-white/5 px-3 py-2">
                              <p className="text-[11px] text-white/50">
                                Total Hours
                              </p>
                              <p className="mt-1 font-semibold text-white/90">
                                {x?.total_hours ?? 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <table className="min-w-full">
                      <thead className="bg-white/5">
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
                            Night
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filtered.map((x) => (
                          <tr
                            key={
                              x?.id ||
                              `${x?.name}-${x?.start_time}-${x?.end_time}`
                            }
                            className="border-t border-white/10 text-sm text-white/85 transition-colors hover:bg-white/[0.04] 2xl:text-base"
                          >
                            <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                              {x?.id ?? "-"}
                            </td>
                            <td className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                              {x?.name || "-"}
                            </td>
                            <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                              {shortTime(x?.start_time)}
                            </td>
                            <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                              {shortTime(x?.end_time)}
                            </td>
                            <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                              {x?.total_hours ?? 0}
                            </td>
                            <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold 2xl:text-sm ${
                                  x?.is_night
                                    ? "border border-amber-400/20 bg-amber-500/15 text-amber-200"
                                    : "border border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                                }`}
                              >
                                {x?.is_night ? "Yes" : "No"}
                              </span>
                            </td>
                          </tr>
                        ))}
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
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px] md:px-6 md:py-6 lg:px-8"
          onMouseDown={() => setOpen(false)}
        >
          <div className="flex h-full w-full items-end justify-center md:items-center">
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="flex h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0d1831] shadow-2xl md:h-auto md:max-h-[92vh] md:max-w-2xl md:rounded-3xl 2xl:max-w-3xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5 md:px-6 2xl:px-7">
                <div>
                  <h2 className="text-lg font-extrabold sm:text-xl 2xl:text-2xl">
                    Create Shift Type
                  </h2>
                  <p className="mt-1 text-xs text-white/55 sm:text-sm 2xl:text-base">
                    Add shift name, timing, total hours, and night status.
                  </p>
                </div>

                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 2xl:h-12 2xl:w-12"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <IoCloseSharp className="text-xl 2xl:text-2xl" />
                </button>
              </div>

              <form onSubmit={onSubmit} className="flex flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 md:px-6 2xl:px-7">
                  <div className="grid grid-cols-1 gap-4 md:gap-5 2xl:gap-6">
                    <div>
                      <label className="text-sm font-medium text-white/80 2xl:text-base">
                        Shift Name
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="Enter shift name"
                        className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none placeholder:text-white/35 focus:border-[#FF5800]/50 focus:bg-white/[0.07] sm:h-12 2xl:h-14 2xl:text-base"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 2xl:gap-6">
                      <div>
                        <label className="text-sm font-medium text-white/80 2xl:text-base">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={form.start_time}
                          onChange={(e) => {
                            const start_time = e.target.value;
                            setForm((p) => ({
                              ...p,
                              start_time,
                              total_hours: calcHours(start_time, p.end_time),
                            }));
                          }}
                          className="time-white mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-[#FF5800]/50 focus:bg-white/[0.07] sm:h-12 2xl:h-14 2xl:text-base"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white/80 2xl:text-base">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={form.end_time}
                          onChange={(e) => {
                            const end_time = e.target.value;
                            setForm((p) => ({
                              ...p,
                              end_time,
                              total_hours: calcHours(p.start_time, end_time),
                            }));
                          }}
                          className="time-white mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-[#FF5800]/50 focus:bg-white/[0.07] sm:h-12 2xl:h-14 2xl:text-base"
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
                          step="0.25"
                          min="0"
                          value={form.total_hours}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              total_hours: e.target.value,
                            }))
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-[#FF5800]/50 focus:bg-white/[0.07] sm:h-12 2xl:h-14 2xl:text-base"
                        />
                      </div>

                      <div className="flex items-end">
                        <div className="mt-0 flex h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 sm:h-12 2xl:h-14">
                          <input
                            id="isNightShift"
                            type="checkbox"
                            checked={form.is_night}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                is_night: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 shrink-0"
                          />
                          <label
                            htmlFor="isNightShift"
                            className="select-none text-sm text-white/85 2xl:text-base"
                          >
                            Night Shift
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 bg-[#0d1831] px-4 py-4 sm:px-5 md:px-6 2xl:px-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 px-5 text-sm font-semibold hover:bg-white/15 sm:h-12 sm:min-w-[130px] 2xl:h-14 2xl:text-base"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={creating}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-[#FF5800] px-5 text-sm font-extrabold hover:brightness-110 disabled:opacity-60 sm:h-12 sm:min-w-[150px] 2xl:h-14 2xl:text-base"
                    >
                      {creating ? "Saving..." : "Save Shift"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
