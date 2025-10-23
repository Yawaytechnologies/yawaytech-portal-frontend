// src/pages/TestWorklog.jsx
import React, { useEffect, useState } from "react";
import { FiEye } from "react-icons/fi";

/* ========= Helpers ========= */
const pad = (n) => String(n).padStart(2, "0");
const toIso = (dateStr, h, m) => `${dateStr}T${pad(h)}:${pad(m)}:00`;
const ymd = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const renderDate = (v) => String(v).slice(0, 10);
const renderTime = (v) => v.match(/T(\d{2}:\d{2})/)?.[1] || "00:00";

/* ========= Status UI ========= */
function StatusPill({ value }) {
  const map = {
    TODO:
      "bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-[inset_0_1px_0_rgba(255,255,255,.6)]",
    IN_PROGRESS:
      "bg-amber-50 text-amber-900 border border-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,.6)]",
    DONE:
      "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-[inset_0_1px_0_rgba(255,255,255,.6)]",
  };
  const cls = map[value] || "bg-slate-100 text-slate-800 border border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {value}
    </span>
  );
}

/* ========= Modal ========= */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      {/* tinted, blurred backdrop */}
      <div
        className="absolute inset-0 bg-indigo-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className="w-[92vw] max-w-2xl overflow-hidden rounded-2xl border border-indigo-200 shadow-2xl">
          {/* gradient frame */}
          <div className="bg-gradient-to-b from-white to-indigo-50">
            {/* colored header band */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
              <h3 className="text-base font-semibold">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-white/20"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-5">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, value }) => (
  <div className="rounded-xl border border-indigo-100 bg-white/80 px-3 py-2">
    <div className="text-[11px] uppercase tracking-wide text-indigo-500/80">
      {label}
    </div>
    <div className="text-sm font-medium text-slate-900">{value}</div>
  </div>
);

/* ========= Dummy data (fully filled) ========= */
const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

function makeOne(employee_id, dayDate, idx) {
  const dateStr = ymd(dayDate);
  const status = STATUSES[idx % STATUSES.length];

  // Always filled
  const start_time = toIso(dateStr, status === "TODO" ? 9 : 10, status === "TODO" ? 30 : 0);
  const end_time = toIso(dateStr, 18, 0);

  let duration_hours = 0;
  if (status === "IN_PROGRESS") {
    const rnd = Math.floor(Math.random() * 6) + 1; // 1–6
    duration_hours = Number(rnd.toFixed(2));
  } else if (status === "DONE") {
    duration_hours = 8;
  } else {
    duration_hours = 0;
  }

  return {
    id: Number(`${dateStr.replace(/-/g, "")}${idx}`),
    employee_id,
    work_date: dateStr,
    start_time,
    end_time,
    duration_hours,
    status,
    task: `Test task for ${dateStr}`,
    description:
      status === "TODO"
        ? "Planning and requirement notes captured."
        : status === "IN_PROGRESS"
        ? "Implementing core module; tests pending."
        : "Feature complete with unit tests.",
    created_at: toIso(dateStr, 9, 0),
    updated_at: toIso(dateStr, 18, status === "DONE" ? 5 : 0),
  };
}

function makeDummyRows({ employee_id = "YTP000007", daysBack = 14 } = {}) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(makeOne(employee_id, d, i));
  }
  return out.sort((a, b) => (a.work_date < b.work_date ? 1 : -1));
}

/* ========= Page ========= */
export default function TestWorklog() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setRows(makeDummyRows({ employee_id: "YTP000007", daysBack: 14 }));
  }, []);

  return (
    <div className="p-6 bg-[#eef2ff] min-h-screen"> {/* subtle indigo page tint */}
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-xl font-semibold text-slate-900">Worklog</h1>

        <div className="rounded-3xl border border-indigo-200/70 bg-white/90 shadow-[0_12px_40px_-12px_rgba(30,41,59,0.25)]">
          <div className="p-4">
            <div className="overflow-hidden rounded-2xl border border-indigo-100 ring-1 ring-indigo-100/70">
              <table className="min-w-full table-fixed text-sm">
                {/* Premium colored header */}
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white/95">
                    <th className="px-4 py-3 text-left text-[13px] font-semibold w-[18%]">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold w-[16%]">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold w-[14%]">
                      Start
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold w-[14%]">
                      End
                    </th>
                    <th className="px-4 py-3 text-right text-[13px] font-semibold w-[12%]">
                      Hours
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold w-[16%]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-[13px] font-semibold w-[10%]">
                      View
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`align-middle transition-colors ${
                        i % 2 ? "bg-indigo-50/40" : "bg-white"
                      } hover:bg-indigo-100/40`}
                    >
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        {r.employee_id}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {renderDate(r.work_date)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {renderTime(r.start_time)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {renderTime(r.end_time)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-800">
                        {r.duration_hours.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill value={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-indigo-700 shadow-sm hover:bg-indigo-50"
                          title="View details"
                          onClick={() => {
                            setSelected(r);
                            setOpen(true);
                          }}
                        >
                          <FiEye size={18} />
                          <span className="hidden sm:inline">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-indigo-700/60">
              Demo data • last 14 days • fully populated
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal (colored) */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={selected ? `Worklog • ${renderDate(selected.work_date)}` : "Worklog"}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ID" value={selected.id} />
              <Field label="Employee" value={selected.employee_id} />
              <Field label="Date" value={renderDate(selected.work_date)} />
              <Field label="Start" value={renderTime(selected.start_time)} />
              <Field label="End" value={renderTime(selected.end_time)} />
              <Field label="Hours" value={selected.duration_hours.toFixed(2)} />
              <Field label="Status" value={selected.status} />
              <Field label="Created" value={renderDate(selected.created_at)} />
              <Field label="Updated" value={renderDate(selected.updated_at)} />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl border border-indigo-100 bg-white/90 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-indigo-500/80">
                  Task
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {selected.task}
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-white/90 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-indigo-500/80">
                  Description
                </div>
                <div className="text-sm text-slate-900">{selected.description}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
