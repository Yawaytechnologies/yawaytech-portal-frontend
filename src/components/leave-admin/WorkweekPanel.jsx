import React, { useEffect } from "react";
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

export default function WorkweekPanel() {
  const dispatch = useDispatch();
  const { cfg, loading } = useSelector((s) => s.workweek);

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

  /* ---- helpers just for summary view ---- */

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
    <div className="grid gap-6 text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Workweek / Weekends</h3>
          <p className="text-sm text-slate-600">
            Choose weekly offs and alternate Saturday rule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg bg-slate-100 px-3 py-2 text-slate-900 hover:bg-slate-200"
            onClick={publish}
          >
            Publish
          </button>
          <button
            className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
            onClick={save}
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor card */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4">
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

        <label className="grid gap-1">
          <span className="text-sm text-slate-700">
            Alternate Saturday Policy
          </span>
          <select
            className="w-60 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
            value={cfg.altSaturday}
            onChange={(e) =>
              dispatch(setLocal({ altSaturday: e.target.value }))
            }
          >
            <option value="NONE">No alternate offs</option>
            <option value="SECOND_FOURTH">
              Second &amp; Fourth Saturday Off
            </option>
            <option value="FIRST_THIRD">
              First &amp; Third Saturday Off
            </option>
            <option value="CUSTOM">Custom Dates (below)</option>
          </select>
        </label>

        {cfg.altSaturday === "CUSTOM" && (
          <label className="grid gap-1">
            <span className="text-sm text-slate-700">
              Custom Off Dates (YYYY-MM-DD, comma-separated)
            </span>
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
              placeholder="2025-12-27, 2026-01-10"
              value={cfg.customOffDays.join(", ")}
              onChange={(e) =>
                dispatch(
                  setLocal({
                    customOffDays: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                )
              }
            />
          </label>
        )}

        <label className="grid gap-1">
          <span className="text-sm text-slate-700">Effective From</span>
          <input
            type="date"
            className="w-60 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
            value={cfg.effectiveFrom}
            onChange={(e) =>
              dispatch(setLocal({ effectiveFrom: e.target.value }))
            }
          />
        </label>

        <div className="text-sm">
          Current Status:{" "}
          {cfg.status === "published" ? (
            <Chip tone="green">Published</Chip>
          ) : (
            <Chip tone="amber">Draft</Chip>
          )}
        </div>
      </div>

      {/* Summary list/table */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              Current Workweek Summary
            </h4>
            <p className="text-xs text-slate-500">
              Region: {cfg.region || "IN-TN"} • Effective from:{" "}
              {cfg.effectiveFrom || "Not set"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[520px] w-full text-xs sm:text-sm">
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
  );
}
