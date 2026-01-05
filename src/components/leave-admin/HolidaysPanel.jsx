// src/components/Admin/HolidaysPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchHolidays,
  setYear,
  upsertHoliday,
  deleteHoliday,
  importHolidays,
  publishHolidays,
} from "../../redux/reducer/leaveholidaysSlice";

/* ---------------------------- small helpers ---------------------------- */
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const [h, ...rows] = lines;
  const heads = h.split(",").map((s) => s.trim()); // holiday_date,name,is_paid,region,recurs_annually

  return rows.map((r) => {
    const cells = r.split(",").map((s) => s.trim());
    const obj = {};
    heads.forEach((k, i) => (obj[k] = cells[i]));

    const holiday_date = obj.holiday_date || obj.date || "";
    const is_paid =
      obj.is_paid === "true" || obj.is_paid === "1" || obj.is_paid === "yes";
    const recurs_annually =
      obj.recurs_annually === "true" ||
      obj.recurs_annually === "1" ||
      obj.recurs_annually === "yes";

    return {
      holiday_date,
      name: obj.name || "",
      is_paid,
      region: obj.region || "",
      recurs_annually,
    };
  });
}

/* ✅ UPDATED: hard limit year to 4 digits + keep YYYY-MM-DD */
function normalizeYMD(value) {
  const raw = String(value ?? "").trim();
  const safe = raw.replace(/[^\d-]/g, "");
  const [yRaw = "", mRaw = "", dRaw = ""] = safe.split("-");

  const y = yRaw.slice(0, 4); // year max 4

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

  // build progressively while typing
  let out = y;
  if (safe.includes("-") || m.length) out += "-" + m;
  if ((safe.match(/-/g) || []).length >= 2 || d.length) out += "-" + d;

  return out.slice(0, 10);
}

/* ------------------------------ Form ------------------------------ */
function HolidayForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(
    () =>
      initial ?? {
        holiday_date: "",
        name: "",
        is_paid: true,
        region: "",
        recurs_annually: false,
      }
  );

  // ✅ UPDATED: hidden native date input for calendar picker
  // const nativeDateRef = useRef(null);

  const change = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    // ✅ UPDATED: always sanitize before save
    onSave({ ...f, holiday_date: normalizeYMD(f.holiday_date) });
  };

  return (
    <form
      onSubmit={submit}
      /* ✅ UPDATED: tighter at 768 + smaller controls */
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4
                 gap-4 md:gap-3 xl:gap-5 text-slate-900"
    >
      {/* ✅ UPDATED: controlled text input (prevents 6-digit year) + calendar picker */}
      <label className="grid gap-1">
        <span className="text-sm text-slate-700">Date</span>

        <div className="relative">
          <input
            type="date" // ✅ UPDATED LINE
            className="h-9 w-full rounded-lg border border-slate-300 bg-white
             px-3 md:px-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={(f.holiday_date || "").slice(0, 10)} // ✅ UPDATED LINE
            onChange={(e) =>
              change("holiday_date", normalizeYMD(e.target.value))
            } // ✅ UPDATED LINE
          />

          {/* calendar button */}

          {/* hidden native date (calendar UI) */}
        </div>
      </label>

      <label className="grid gap-1 md:col-span-1 lg:col-span-2">
        <span className="text-sm text-slate-700">Name</span>
        <input
          className="h-9 rounded-lg border border-slate-300 bg-white
                     px-3 md:px-2
                     text-sm md:text-[13px] lg:text-sm
                     outline-none focus:ring-2 focus:ring-indigo-500
                     text-slate-900 placeholder:text-slate-400"
          placeholder="Independence Day"
          value={f.name}
          onChange={(e) => change("name", e.target.value)}
          required
        />
      </label>

      <label className="flex items-center gap-2 md:mt-6 lg:mt-6">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          checked={!!f.is_paid}
          onChange={(e) => change("is_paid", e.target.checked)}
        />
        <span className="text-sm text-slate-700">Paid holiday</span>
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-slate-700">Region</span>
        <input
          className="h-9 rounded-lg border border-slate-300 bg-white
                     px-3 md:px-2
                     text-sm md:text-[13px] lg:text-sm
                     outline-none focus:ring-2 focus:ring-indigo-500
                     text-slate-900 placeholder:text-slate-400"
          placeholder="TN / KA / All India"
          value={f.region}
          onChange={(e) => change("region", e.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 md:mt-4 lg:mt-6">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          checked={!!f.recurs_annually}
          onChange={(e) => change("recurs_annually", e.target.checked)}
        />
        <span className="text-sm text-slate-700">Recurs every year</span>
      </label>

      <div className="md:col-span-2 lg:col-span-4 flex items-center gap-2">
        <button
          className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
          type="submit"
        >
          Save
        </button>
        <button
          className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200 text-slate-900"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* --------------------------- Main Panel --------------------------- */
export default function HolidaysPanel() {
  const dispatch = useDispatch();
  const { year, items, loading } = useSelector((s) => s.holidays);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchHolidays(year));
  }, [year, dispatch]);

  const upsert = (data) =>
    dispatch(upsertHoliday(editing ? { ...data, id: editing.id } : data)).then(
      () => {
        setEditing(null);
        setCreating(false);
      }
    );

  const remove = (row) => {
    if (confirm(`Delete ${row.name} (${row.date || row.holiday_date})?`)) {
      dispatch(deleteHoliday(row.id));
    }
  };

  const importCSV = async (file) => {
    const txt = await file.text();
    dispatch(importHolidays(parseCSV(txt)));
  };

  const publish = () =>
    dispatch(publishHolidays(year)).then((r) =>
      alert(
        `Holidays ${year} published at ${new Date(
          r.payload.publishedAt
        ).toLocaleString()}`
      )
    );

  const years = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) =>
        String(new Date().getFullYear() - 2 + i)
      ),
    []
  );

  return (
    <div className="grid gap-6 text-slate-900">
      {/* header */}
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-1 min-w-0">
          <h3 className="text-xl font-semibold">Public Holidays</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            value={year}
            onChange={(e) => dispatch(setYear(e.target.value))}
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>

          <label className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200 cursor-pointer text-slate-900">
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && importCSV(e.target.files[0])
              }
            />
          </label>

          <a
            className="text-sm underline text-slate-700"
            href={
              "data:text/csv;charset=utf-8," +
              encodeURIComponent(
                "holiday_date,name,is_paid,region,recurs_annually\n" +
                  "2025-01-26,Republic Day,true,IN,true"
              )
            }
            download="holidays-sample.csv"
          >
            CSV sample
          </a>

          <button
            className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200 text-slate-900"
            onClick={publish}
          >
            Publish
          </button>

          <button
            className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
          >
            New Holiday
          </button>
        </div>
      </div>

      {/* form */}
      {(creating || editing) && (
        <div
          className="rounded-xl border border-slate-200 bg-white
                     p-4 sm:p-5
                     md:max-w-2xl md:mx-auto
                     xl:max-w-none"
        >
          <HolidayForm
            initial={
              editing
                ? {
                    holiday_date: editing.holiday_date || editing.date || "",
                    name: editing.name || "",
                    is_paid: !!editing.is_paid,
                    region: editing.region ?? "",
                    recurs_annually: !!editing.recurs_annually,
                  }
                : undefined
            }
            onSave={upsert}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[780px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-800">
            <tr>
              <th className="p-2 text-left font-semibold">Date</th>
              <th className="p-2 text-left font-semibold">Name</th>
              <th className="p-2 text-left font-semibold">Paid</th>
              <th className="p-2 text-left font-semibold">Region</th>
              <th className="p-2 text-left font-semibold">Recurs</th>
              <th className="p-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-900">
            {loading ? (
              <tr>
                <td className="p-4" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : items.length ? (
              items.map((r) => (
                <tr key={r.id} className="border-b border-slate-200">
                  <td className="p-2">{r.holiday_date || r.date || "—"}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.is_paid ? "Paid" : "Unpaid"}</td>
                  <td className="p-2">{r.region || "—"}</td>
                  <td className="p-2">{r.recurs_annually ? "Yes" : "No"}</td>
                  <td className="p-2 text-right whitespace-nowrap">
                    <button
                      className="rounded-lg px-2 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-900 mr-2"
                      onClick={() =>
                        setEditing({
                          ...r,
                          holiday_date: r.holiday_date || r.date || "",
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-lg px-2 py-1 text-sm bg-red-600 text-white hover:bg-red-700"
                      onClick={() => remove(r)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-4" colSpan={6}>
                  No holidays added.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
