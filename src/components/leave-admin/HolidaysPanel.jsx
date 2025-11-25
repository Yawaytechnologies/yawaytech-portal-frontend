// src/components/Admin/HolidaysPanel.jsx (or your existing path)
import React, { useEffect, useState } from "react";
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
      obj.is_paid === "true" ||
      obj.is_paid === "1" ||
      obj.is_paid === "yes";
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

  const change = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave(f);
  };

  return (
    <form
      onSubmit={submit}
      className="grid md:grid-cols-4 gap-4 text-slate-900"
    >
      <label className="grid gap-1">
        <span className="text-sm text-slate-700">Date</span>
        <input
          type="date"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          value={f.holiday_date}
          onChange={(e) => change("holiday_date", e.target.value)}
          required
        />
      </label>

      <label className="grid gap-1 md:col-span-2">
        <span className="text-sm text-slate-700">Name</span>
        <input
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
          placeholder="Independence Day"
          value={f.name}
          onChange={(e) => change("name", e.target.value)}
          required
        />
      </label>

      <label className="flex items-center gap-2 mt-6 md:mt-0">
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
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
          placeholder="TN / KA / All India"
          value={f.region}
          onChange={(e) => change("region", e.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 mt-6 md:mt-0">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          checked={!!f.recurs_annually}
          onChange={(e) =>
            change("recurs_annually", e.target.checked)
          }
        />
        <span className="text-sm text-slate-700">
          Recurs every year
        </span>
      </label>

      <div className="md:col-span-4 flex items-center gap-2">
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
    dispatch(
      upsertHoliday(
        editing ? { ...data, id: editing.id } : data
      )
    ).then(() => {
      setEditing(null);
      setCreating(false);
    });

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

  const years = Array.from({ length: 5 }).map((_, i) =>
    String(new Date().getFullYear() - 2 + i)
  );

  return (
    <div className="grid gap-6 text-slate-900">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Public Holidays</h3>
          <p className="text-sm text-slate-600">
            Add/edit/delete &amp; publish the official holiday list.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
                e.target.files?.[0] &&
                importCSV(e.target.files[0])
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
        <div className="rounded-xl border border-slate-200 p-4 bg-white">
          <HolidayForm
            initial={
              editing
                ? {
                    // normalize editing row
                    holiday_date:
                      editing.holiday_date ||
                      editing.date ||
                      "",
                    name: editing.name || "",
                    is_paid: !!editing.is_paid,
                    region: editing.region ?? "",
                    recurs_annually:
                      !!editing.recurs_annually,
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
      <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[780px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-800">
            <tr>
              <th className="p-2 text-left font-semibold">Date</th>
              <th className="p-2 text-left font-semibold">Name</th>
              <th className="p-2 text-left font-semibold">Paid</th>
              <th className="p-2 text-left font-semibold">
                Region
              </th>
              <th className="p-2 text-left font-semibold">
                Recurs
              </th>
              <th className="p-2 text-right font-semibold">
                Actions
              </th>
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
                <tr
                  key={r.id}
                  className="border-b border-slate-200"
                >
                  <td className="p-2">
                    {r.holiday_date || r.date || "—"}
                  </td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">
                    {r.is_paid ? "Paid" : "Unpaid"}
                  </td>
                  <td className="p-2">
                    {r.region || "—"}
                  </td>
                  <td className="p-2">
                    {r.recurs_annually ? "Yes" : "No"}
                  </td>
                  <td className="p-2 text-right">
                    <button
                      className="rounded-lg px-2 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-900 mr-2"
                      onClick={() =>
                        setEditing({
                          ...r,
                          holiday_date:
                            r.holiday_date ||
                            r.date ||
                            "",
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
