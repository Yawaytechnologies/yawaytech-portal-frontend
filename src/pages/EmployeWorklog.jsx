// src/pages/EmployeeWorklog.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  selectWorklogItems,
  selectWorklogLoading,
  selectWorklogError,
  selectWorklogTotal,
  selectWorklogFilters,
} from "../redux/reducer/worklogSlice.js";
import { setWorklogFilters } from "../redux/actions/worklogActions";

const ACCENT = "#FF5800";

/* ===========================
   Display Helpers (robust)
   =========================== */
const renderDate = (v) => {
  if (!v) return "—";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  return s || "—";
};

const renderTime = (v) => {
  if (!v) return "—";
  const s = String(v);
  const iso = s.includes("T") && !/[zZ]|[+\-]\d{2}:?\d{2}$/.test(s) ? s + "Z" : s;
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const calcHours = (start, end, server) => {
  if (typeof server === "number" && isFinite(server)) return server;
  const fix = (x) =>
    (x || "")
      .replace(/(\.\d{3})\d+$/, "$1")
      .concat(x && x.includes("T") && !/[zZ+\-]\d{2}:?\d{2}$/.test(x) ? "Z" : "");
  const S = new Date(fix(start));
  const E = new Date(fix(end));
  if (isNaN(S) || isNaN(E) || E <= S) return 0;
  return +(((E - S) / 36e5).toFixed(2));
};

// live hours for IN_PROGRESS from start_time → now
const liveHours = (start) => {
  if (!start) return 0;
  const s = new Date(
    start.includes("T") && !/[zZ+\-]\d{2}:?\d{2}$/.test(start) ? start + "Z" : start
  ).getTime();
  const now = Date.now();
  if (Number.isNaN(s) || now <= s) return 0;
  return +(((now - s) / 36e5).toFixed(2));
};

/* ===========================
   Dummy generator (Jan → Jul 2025)
   =========================== */
const DATE_FROM = "2025-01-01";
const DATE_TO = "2025-07-31";
const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

function eachDay(startStr, endStr) {
  const out = [];
  const s = new Date(startStr + "T00:00:00Z");
  const e = new Date(endStr + "T00:00:00Z");
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(new Date(d));
  }
  return out;
}

const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const withTime = (dateStr, h, m) => `${dateStr}T${pad(h)}:${pad(m)}:00`;

function genRowForDay(employeeId, day, idxSeed) {
  const work_date = isoDate(day);
  const status = STATUSES[idxSeed % STATUSES.length];

  let start_time = null;
  let end_time = null;
  let duration_hours = null;

  if (status === "IN_PROGRESS") {
    start_time = withTime(work_date, 10, 0);
  } else if (status === "DONE") {
    start_time = withTime(work_date, 10, 0);
    end_time = withTime(work_date, 18, 0);
    duration_hours = 8;
  }

  return {
    id: Number(`${work_date.replace(/-/g, "")}01`), // stable ID per day
    employee_id: employeeId,
    work_date,
    task: `Daily task for ${work_date}`,
    description:
      status === "TODO"
        ? "Planning and requirement clarification."
        : status === "IN_PROGRESS"
        ? "Currently implementing the module."
        : "Completed implementation with testing.",
    status,
    start_time,
    end_time,
    duration_hours,
    created_at: `${work_date}T09:30:00`,
    updated_at: end_time ? `${work_date}T18:05:00` : `${work_date}T12:00:00`,
  };
}

function makeDummyRange(employeeId, from = DATE_FROM, to = DATE_TO) {
  const days = eachDay(from, to);
  return days
    .map((d, i) => genRowForDay(employeeId, d, i))
    .sort((a, b) => (a.work_date < b.work_date ? 1 : -1)); // newest first
}

/* ===========================
   Component
   =========================== */
export default function EmployeeWorklog() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // keep selectors for header display; table uses local dummyRows
  const items = useSelector(selectWorklogItems);
  const loading = useSelector(selectWorklogLoading);
  const error = useSelector(selectWorklogError);
  const total = useSelector(selectWorklogTotal);
  const filters = useSelector(selectWorklogFilters);

  const [dummyRows, setDummyRows] = useState([]);

  // Set the visible filter range + build dummy data
  useEffect(() => {
    if (!employeeId) return;
    const from = DATE_FROM;
    const to = DATE_TO;

    if (filters.employeeId !== employeeId || filters.from !== from || filters.to !== to) {
      dispatch(setWorklogFilters({ employeeId, from, to }));
    }

    setDummyRows(makeDummyRange(employeeId, from, to));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, employeeId]);

  const rows = useMemo(() => dummyRows, [dummyRows]);

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-[#FF5800] underline hover:opacity-80"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-[#0e1b34]">
            Worklog • <span className="font-normal text-gray-600">{employeeId}</span>
          </h1>
        </div>

        <div className="mb-3 text-xs text-gray-600">
          Range:{" "}
          <span className="font-medium">
            {filters.from || "—"} → {filters.to || "—"}
          </span>
          {" • "}
          Total: <span className="font-medium">{total || rows.length}</span>
        </div>

        <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800 text-xs">
          Demo mode: showing dummy data for every day between <b>2025-01-01</b> and <b>2025-07-31</b>.
        </div>

        <div
          className="bg-white rounded-xl shadow-lg border-t-4"
          style={{ borderColor: ACCENT }}
        >
          {rows.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No worklogs found.</div>
          ) : (
            <div className="p-4">
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[22%]" /> {/* Task */}
                    <col className="w-[32%]" /> {/* Description */}
                    <col className="w-[12%]" /> {/* Date */}
                    <col className="w-[10%]" /> {/* Start */}
                    <col className="w-[10%]" /> {/* End */}
                    <col className="w-[8%]" />  {/* Hours */}
                    <col className="w-[6%]" />  {/* Status */}
                  </colgroup>
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-600">
                      <th className="px-3 py-2">Task</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Start</th>
                      <th className="px-3 py-2">End</th>
                      <th className="px-3 py-2 text-right">Hours</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const id = r.id;
                      const task = r.task;
                      const desc = r.description;
                      const startRaw = r.start_time || "";
                      const endRaw = r.end_time || "";
                      const dateRaw =
                        r.work_date || (startRaw ? String(startRaw).slice(0, 10) : "");
                      const statusVal = r.status || "—";

                      let hoursVal = 0;
                      if (statusVal === "DONE") {
                        hoursVal = Number.isFinite(r.duration_hours)
                          ? r.duration_hours
                          : calcHours(startRaw, endRaw, null);
                      } else if (statusVal === "IN_PROGRESS") {
                        hoursVal = liveHours(startRaw);
                      } else {
                        hoursVal = 0; // TODO
                      }

                      return (
                        <tr key={id} className="border-t align-top">
                          <td className="px-3 py-2 font-medium text-[#0e1b34] break-words">
                            {task}
                          </td>
                          <td className="px-3 py-2 text-gray-700 break-words">
                            {desc}
                          </td>
                          <td className="px-3 py-2">{renderDate(dateRaw)}</td>
                          <td className="px-3 py-2">{renderTime(startRaw)}</td>
                          <td className="px-3 py-2">{renderTime(endRaw)}</td>
                          <td className="px-3 py-2 text-right">
                            {Number.isFinite(hoursVal) ? hoursVal.toFixed(2) : "0.00"}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className="inline-block rounded-full border px-2 py-0.5 text-xs"
                              style={{ borderColor: ACCENT, color: ACCENT }}
                            >
                              {statusVal}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* In demo mode, Refresh just regenerates the same set */}
              <div className="mt-4 text-right">
                <button
                  onClick={() =>
                    setDummyRows(makeDummyRange(employeeId, DATE_FROM, DATE_TO))
                  }
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
