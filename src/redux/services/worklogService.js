// src/services/worklogService.js
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const join = (a,b)=>`${String(a).replace(/\/+$/,'')}/${String(b).replace(/^\/+/,'')}`;

export async function getEmployeeWorklogs({ employeeId, from, to }) {
  if (!API_BASE) throw new Error("VITE_API_BASE_URL missing");

  // swagger path: /api/worklog/employee/{id}
  const url = new URL(join(API_BASE, `api/worklog/employee/${encodeURIComponent(employeeId)}`));
  if (from) url.searchParams.set("from", from);
  if (to)   url.searchParams.set("to", to);

  const res  = await fetch(url.toString(), { credentials: "include" });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { throw new Error(`Bad JSON (${res.status})`); }
  if (!res.ok) throw new Error(data?.detail || data?.message || `HTTP ${res.status}`);

  // normalize shapes/keys so table never blanks
  const normalize = (x)=>({
    ...x,
    work_date : x.work_date ?? x.date ?? "",
    start_time: x.start_time ?? x.startTime ?? x.start ?? "",
    end_time  : x.end_time   ?? x.endTime   ?? x.end   ?? "",
    work_type : x.work_type  ?? x.workType  ?? x.type  ?? "",
    status    : x.status     ?? x.state     ?? "",
  });

  const arr = Array.isArray(data) ? data
           : Array.isArray(data.items) ? data.items
           : Array.isArray(data.data) ? data.data
           : Array.isArray(data.results) ? data.results
           : [];

  const items = arr.map(normalize);
  return { items, total: items.length };
}
