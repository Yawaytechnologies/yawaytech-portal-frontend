// src/components/leave-admin/WorkweekPanel.jsx  (use your exact path)
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWorkweek,
  saveWorkweek,
  publishWorkweek,
  setLocal,
  toggleWeekly,
} from "../../redux/reducer/leaveworkweekSlice";
import Chip from "./ui/Chip";
import cx from "./ui/cx";

/* ✅ UPDATED: force YYYY-MM-DD (4-digit year only) */
function normalizeYMD30(value) {
  const raw = String(value ?? "").trim();
  const safe = raw.replace(/[^\d-]/g, "");
  const [yRaw = "", mRaw = "", dRaw = ""] = safe.split("-");
  const y = yRaw.slice(0, 4);

  let m = mRaw.replace(/[^\d]/g, "").slice(0, 2);
  if (m.length === 2) {
    let mm = Number(m);
    if (Number.isNaN(mm)) mm = 1;
    if (mm < 1) mm = 1;
    if (mm > 12) mm = 12;
    m = String(mm).padStart(2, "0");
  }

  let d = dRaw.replace(/[^\d]/g, "").slice(0, 2);
  if (d.length === 2) {
    let dd = Number(d);
    if (Number.isNaN(dd)) dd = 1;
    if (dd < 1) dd = 1;
    if (dd > 31) dd = 31;
    d = String(dd).padStart(2, "0");
  }

  let out = y;
  if (safe.includes("-") || m.length) out += "-" + m;
  if ((safe.match(/-/g) || []).length >= 2 || d.length) out += "-" + d;
  return out.slice(0, 10);
}

function isValidYMD30(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [, m, d] = v.split("-");
  const mm = Number(m);
  const dd = Number(d);
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 30) return false;
  return true;
}

export default function WorkweekPanel() {
  const dispatch = useDispatch();
  const { cfg, loading } = useSelector((s) => s.workweek);

  /* ✅ UPDATED: used to open native calendar picker */
  const nativeDateRef = useRef(null);

  useEffect(() => {
    dispatch(fetchWorkweek());
  }, [dispatch]);

  if (loading || !cfg) return <div className="text-slate-900">Loading…</div>;

  const days = [
    { id: "MON", label: "Mon" },
    { id: "TUE", label: "Tue" },
    { id: "WED", label: "Wed" },
    { id: "THU", label: "Thu" },
    { id: "FRI", label: "Fri" },
    { id: "SAT", label: "Sat" },
    { id: "SUN", label: "Sun" },
  ];

  const save = () =>
    dispatch(saveWorkweek(cfg)).then(() => alert("Workweek saved"));

  const publish = () =>
    dispatch(publishWorkweek()).then((r) =>
      alert(
        `Workweek published at ${new Date(
          r.payload.publishedAt
        ).toLocaleString()}`
      )
    );

  const isOff = (id) => (cfg.weeklyOff || []).includes(id);

  const satNote = () => {
    switch (cfg.altSaturday) {
      case "SECOND_FOURTH":
        return " (2nd & 4th off)";
      case "FIRST_THIRD":
        return " (1st & 3rd off)";
      case "CUSTOM":
        return cfg.customOffDays.length
          ? ` (custom: ${cfg.customOffDays.join(", ")})`
          : " (custom)";
      default:
        return "";
    }
  };

  const dayStatusLabel = (id) => {
    if (id === "SAT") {
      if (isOff("SAT")) return "Weekly Off";
      if (cfg.altSaturday !== "NONE") return `Working${satNote()}`;
      return "Working";
    }
    return isOff(id) ? "Weekly Off" : "Working";
  };

  return (
    <div className="grid gap-5 sm:gap-6 xl:gap-8 text-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg sm:text-xl font-semibold">
            Workweek / Weekends
          </h3>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            className="w-full sm:w-auto rounded-lg bg-slate-100 px-3 py-2 text-slate-900 hover:bg-slate-200"
            onClick={publish}
          >
            Publish
          </button>
          <button
            className="w-full sm:w-auto rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
            onClick={save}
          >
            Save
          </button>
        </div>
      </div>

      {/* Layout:
          - Until xl (<1280): stack (prevents awkward 1024 look)
          - From xl (>=1280): side-by-side with stable right column width
      */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        {/* Editor card */}
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <label className="grid gap-1">
            <span className="text-sm text-slate-700">Weekly Off Days</span>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <button
                  key={d.id}
                  onClick={() => dispatch(toggleWeekly(d.id))}
                  className={cx(
                    "rounded-lg px-3 py-1 border transition-colors text-sm",
                    cfg.weeklyOff.includes(d.id)
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </label>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm text-slate-700">
                Alternate Saturday Policy
              </span>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                value={cfg.altSaturday}
                onChange={(e) =>
                  dispatch(setLocal({ altSaturday: e.target.value }))
                }
              >
                <option value="NONE">No Alternate Offs</option>
                <option value="SECOND_FOURTH">
                  Second &amp; Fourth Saturday Off
                </option>
                <option value="FIRST_THIRD">
                  First &amp; Third Saturday Off
                </option>
                <option value="CUSTOM">Custom Dates (below)</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-700">Effective From</span>

              {/* ✅ UPDATED: 4-digit year only + still allows calendar click */}
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pr-10
               text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={cfg.effectiveFrom || ""}
                  onChange={(e) =>
                    dispatch(
                      setLocal({
                        effectiveFrom: normalizeYMD30(e.target.value),
                      })
                    )
                  }
                  onBlur={() => {
                    const fixed = normalizeYMD30(cfg.effectiveFrom || "");
                    dispatch(setLocal({ effectiveFrom: fixed }));
                    if (fixed && !isValidYMD30(fixed)) {
                      dispatch(setLocal({ effectiveFrom: "" }));
                    }
                  }}
                />

                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  onClick={() => nativeDateRef.current?.showPicker?.()}
                  aria-label="Open calendar"
                  title="Open calendar"
                >
                  📅
                </button>

                <input
                  ref={nativeDateRef}
                  type="date"
                  className="absolute inset-0 opacity-0 pointer-events-none"
                  value={cfg.effectiveFrom || ""}
                  onChange={(e) =>
                    dispatch(
                      setLocal({
                        effectiveFrom: normalizeYMD30(e.target.value),
                      })
                    )
                  }
                />
              </div>
            </label>
          </div>

          {cfg.altSaturday === "CUSTOM" && (
            <label className="grid gap-1">
              <span className="text-sm text-slate-700">
                Custom Off Dates (YYYY-MM-DD, comma-separated)
              </span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                placeholder="2025-12-27, 2026-01-10"
                value={cfg.customOffDays.join(", ")}
                onChange={(e) => {
                  const parts = e.target.value.split(",").map((x) => x.trim());

                  const d1 = normalizeYMD30(parts[0] || "");

                  const raw2 = parts[1] || "";
                  const strictYMD = /^\d{4}-\d{2}-\d{2}$/;
                  const d2 =
                    strictYMD.test(raw2) && isValidYMD30(raw2) ? raw2 : "";

                  dispatch(
                    setLocal({
                      customOffDays: [d1, d2].filter(Boolean).slice(0, 2),
                    })
                  );
                }}
                onBlur={() => {
                  const cleaned = (cfg.customOffDays || [])
                    .map((x) => normalizeYMD30(x))
                    .filter(isValidYMD30)
                    .slice(0, 2);

                  dispatch(setLocal({ customOffDays: cleaned }));
                }}
              />
            </label>
          )}

          <div className="text-sm">
            Current Status:{" "}
            {cfg.status === "published" ? (
              <Chip tone="green">Published</Chip>
            ) : (
              <Chip tone="amber">Draft</Chip>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 xl:sticky xl:top-5">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-slate-800">
              Current Workweek Summary
            </h4>
          </div>

          {/* stacked list up to xl (no horizontal scroll) */}
          <div className="grid gap-2 xl:hidden">
            {days.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-800">
                  {d.label}
                </span>

                {d.id === "SAT" && cfg.altSaturday !== "NONE" ? (
                  <span className="text-right">
                    <span
                      className={cx(
                        "block text-sm font-semibold",
                        isOff("SAT") ? "text-red-600" : "text-emerald-600"
                      )}
                    >
                      {isOff("SAT") ? "Weekly Off" : "Working"}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {satNote().slice(1) || "no alt rule"}
                    </span>
                  </span>
                ) : (
                  <span
                    className={cx(
                      "text-sm font-semibold",
                      isOff(d.id) ? "text-red-600" : "text-emerald-600"
                    )}
                  >
                    {dayStatusLabel(d.id)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* table only at xl+ */}
          <div className="hidden xl:block">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-slate-50 text-slate-800">
                <tr>
                  {days.map((d) => (
                    <th
                      key={d.id}
                      className="px-2 py-2 text-center font-semibold"
                    >
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {days.map((d) => (
                    <td
                      key={d.id}
                      className="px-2 py-2 text-center align-middle"
                    >
                      {d.id === "SAT" && cfg.altSaturday !== "NONE" ? (
                        <span className="inline-flex flex-col items-center gap-0.5 leading-tight">
                          <span
                            className={
                              isOff("SAT")
                                ? "text-red-600 font-medium"
                                : "text-emerald-600 font-medium"
                            }
                          >
                            {isOff("SAT") ? "Weekly Off" : "Working"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {satNote().slice(1) || "no alt rule"}
                          </span>
                        </span>
                      ) : (
                        <span
                          className={
                            isOff(d.id)
                              ? "text-red-600 font-medium"
                              : "text-emerald-600 font-medium"
                          }
                        >
                          {dayStatusLabel(d.id)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
