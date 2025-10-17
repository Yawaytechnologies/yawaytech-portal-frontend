import React, { useMemo } from "react";

const ACCENT = "#FF5800";

/* helpers */
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
  // add Z if ISO without timezone
  const iso = s.includes("T") && !/[zZ]|[+\-]\d{2}:?\d{2}$/.test(s) ? s + "Z" : s;
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const normalize = (x) => ({
  ...x,
  id: x.id ?? `${x.employee_id || "emp"}-${x.start_time || x.startTime || Math.random()}`,
  employee_id: x.employee_id ?? x.employeeId ?? x.empId ?? "—",
  work_date: x.work_date ?? x.date ?? "—",
  task: x.task ?? "—",
  description: x.description ?? "—",
  start_time: x.start_time ?? x.startTime ?? x.start ?? "",
  end_time: x.end_time ?? x.endTime ?? x.end ?? "",
  duration_hours:
    typeof x.duration_hours === "number" ? x.duration_hours :
    typeof x.hours === "number" ? x.hours : 0,
  work_type: x.work_type ?? x.workType ?? x.type ?? "—",
  status: x.status ?? x.state ?? "—",
  created_at: x.created_at ?? x.createdAt ?? "",
  updated_at: x.updated_at ?? x.updatedAt ?? "",
});

export default function AllWorklogsTable({ items = [], title = "All Worklogs" }) {
  const rows = useMemo(() => {
    const arr = items.map(normalize);
    arr.sort((a, b) => {
      const da = (a.work_date || "").slice(0, 10);
      const db = (b.work_date || "").slice(0, 10);
      if (da !== db) return da < db ? 1 : -1; // newest first
      return (a.start_time || "") < (b.start_time || "") ? 1 : -1;
    });
    return arr;
  }, [items]);

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-lg font-semibold text-[#0e1b34] mb-4">{title}</h1>

        <div
          className="bg-white rounded-xl shadow-lg border-t-4"
          style={{ borderColor: ACCENT }}
        >
          {rows.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No worklogs found.</div>
          ) : (
            <div className="p-4">
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-600">
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Employee</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Start</th>
                      <th className="px-3 py-2">End</th>
                      <th className="px-3 py-2 text-right">Hours</th>
                      <th className="px-3 py-2">Task</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Created</th>
                      <th className="px-3 py-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-t align-top">
                        <td className="px-3 py-2 text-gray-800">{r.id}</td>
                        <td className="px-3 py-2">{r.employee_id}</td>
                        <td className="px-3 py-2">{renderDate(r.work_date)}</td>
                        <td className="px-3 py-2">{renderTime(r.start_time)}</td>
                        <td className="px-3 py-2">{renderTime(r.end_time)}</td>
                        <td className="px-3 py-2 text-right">
                          {Number.isFinite(r.duration_hours) ? r.duration_hours.toFixed(2) : "0.00"}
                        </td>
                        <td className="px-3 py-2 font-medium text-[#0e1b34] break-words">{r.task}</td>
                        <td className="px-3 py-2 text-gray-700 break-words">{r.description}</td>
                        <td className="px-3 py-2">{r.work_type}</td>
                        <td className="px-3 py-2">
                          <span
                            className="inline-block rounded-full border px-2 py-0.5 text-xs"
                            style={{ borderColor: ACCENT, color: ACCENT }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{renderDate(r.created_at)}</td>
                        <td className="px-3 py-2 text-gray-600">{renderDate(r.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-xs text-gray-600">
                Showing <span className="font-medium">{rows.length}</span> rows
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
