import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchHolidays,
  setYear,
  upsertHoliday,
  deleteHoliday,
} from "../../redux/reducer/leaveholidaysSlice";

/* ---------------- DATE NORMALIZER ---------------- */
function normalizeYMD(value) {
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
  if (safe.includes("-") || m.length) out += `-${m}`;
  if ((safe.match(/-/g) || []).length >= 2 || d.length) out += `-${d}`;

  return out.slice(0, 10);
}

/* ---------------- SMALL UI HELPERS ---------------- */
function SectionCard({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[220px] sm:min-h-[260px] items-center justify-center px-4 py-10">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
          📅
        </div>
        <h4 className="text-base sm:text-lg font-semibold text-slate-900">
          No holidays added
        </h4>
        <p className="mt-1 text-sm text-slate-500">
          Create company holidays for the selected year.
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 p-4 sm:p-5 lg:p-6">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-12 sm:h-14 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

/* ---------------- FORM ---------------- */
function HolidayForm({ onSave, onCancel }) {
  const [f, setF] = useState({
    holiday_date: "",
    name: "",
    region: "",
    recurs_annually: false,
  });

  const change = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const submit = (e) => {
    e.preventDefault();

    onSave({
      ...f,
      is_paid: true,
      holiday_date: normalizeYMD(f.holiday_date),
      region: String(f.region || "").trim(),
      name: String(f.name || "").trim(),
    });
  };

  return (
    <SectionCard className="overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5 sm:py-4 lg:px-6">
        <div className="flex flex-col gap-1">
          <h4 className="text-base sm:text-lg font-semibold text-slate-900">
            Add New Holiday
          </h4>
         
        </div>
      </div>

      <form
        onSubmit={submit}
        className="grid grid-cols-1 gap-4 p-4 sm:gap-5 sm:p-5 lg:grid-cols-2 lg:p-6 xl:grid-cols-4"
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Date</span>
          <input
            type="date"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            value={(f.holiday_date || "").slice(0, 10)}
            onChange={(e) =>
              change("holiday_date", normalizeYMD(e.target.value))
            }
            required
          />
        </label>

        <label className="grid gap-2 lg:col-span-1 xl:col-span-2">
          <span className="text-sm font-medium text-slate-700">Holiday Name</span>
          <input
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="Ex: Independence Day"
            value={f.name}
            onChange={(e) => change("name", e.target.value)}
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Region</span>
          <input
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="Ex: TN / All India"
            value={f.region}
            onChange={(e) => change("region", e.target.value)}
          />
        </label>

        <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:px-4 lg:col-span-2 xl:col-span-1">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            checked={!!f.recurs_annually}
            onChange={(e) => change("recurs_annually", e.target.checked)}
          />
          <span className="text-sm font-medium text-slate-700">
            Recurs every year
          </span>
        </label>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row lg:col-span-2 xl:col-span-4">
          <button
            className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            type="submit"
          >
            Save Holiday
          </button>

          <button
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

/* ---------------- MOBILE CARD LIST ---------------- */
function MobileHolidayList({ items, onDelete }) {
  if (!items.length) return <EmptyState />;

  return (
    <div className="grid gap-3 p-3 sm:gap-4 sm:p-4">
      {items.map((r) => (
        <div
          key={r.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">
                {r.name || "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {r.holiday_date || r.date || "—"}
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
              {r.recurs_annually ? "Recurring" : "One-time"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500">Region</span>
              <span className="text-sm font-semibold text-slate-800">
                {r.region || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500">Recurs</span>
              <span className="text-sm font-semibold text-slate-800">
                {r.recurs_annually ? "Yes" : "No"}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
              onClick={() => onDelete(r)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- DESKTOP TABLE ---------------- */
function DesktopHolidayTable({ items, onDelete }) {
  if (!items.length) return <EmptyState />;

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-5 lg:px-6">
                Date
              </th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-5 lg:px-6">
                Name
              </th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-5 lg:px-6">
                Region
              </th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-5 lg:px-6">
                Recurs
              </th>
              <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-5 lg:px-6">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((r, i) => (
              <tr
                key={r.id}
                className={[
                  "border-b border-slate-100 transition hover:bg-slate-50",
                  i === items.length - 1 ? "border-b-0" : "",
                ].join(" ")}
              >
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-800 sm:px-5 lg:px-6">
                  {r.holiday_date || r.date || "—"}
                </td>

                <td className="px-4 py-4 text-sm font-semibold text-slate-900 sm:px-5 lg:px-6">
                  <div className="max-w-[240px] xl:max-w-[420px] truncate">
                    {r.name || "—"}
                  </div>
                </td>

                <td className="px-4 py-4 text-sm text-slate-700 sm:px-5 lg:px-6">
                  {r.region || "—"}
                </td>

                <td className="px-4 py-4 sm:px-5 lg:px-6">
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                      r.recurs_annually
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-700",
                    ].join(" ")}
                  >
                    {r.recurs_annually ? "Yes" : "No"}
                  </span>
                </td>

                <td className="px-4 py-4 text-right sm:px-5 lg:px-6">
                  <button
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-3.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
                    onClick={() => onDelete(r)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- MAIN ---------------- */
export default function HolidaysPanel() {
  const dispatch = useDispatch();
  const { year, items, loading } = useSelector((s) => s.holidays);

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchHolidays(year));
  }, [year, dispatch]);

  const createHoliday = (data) =>
    dispatch(upsertHoliday(data)).then(() => {
      setCreating(false);
    });

  const remove = (row) => {
    if (window.confirm(`Delete ${row.name}?`)) {
      dispatch(deleteHoliday(row.id));
    }
  };

  const years = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) =>
        String(new Date().getFullYear() - 3 + i)
      ),
    []
  );

  return (
    <div className="w-full min-w-0 text-slate-900">
      <div className="mx-auto w-full max-w-[2560px] px-3 py-3 sm:px-4 sm:py-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10">
        <div className="grid gap-4 sm:gap-5 xl:gap-6">
          {/* HEADER */}
          <SectionCard className="overflow-hidden">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6 xl:px-7">
              <div className="min-w-0">
                

                <h3 className="mt-3 text-lg font-bold text-slate-900 sm:text-xl xl:text-2xl">
                  Company Holidays
                </h3>
               
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:items-center">
                <select
                  className="h-11 min-w-[110px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  value={year}
                  onChange={(e) => dispatch(setYear(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>

                <button
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:px-5"
                  onClick={() => setCreating((prev) => !prev)}
                >
                  {creating ? "Close Form" : "New Holiday"}
                </button>
              </div>
            </div>
          </SectionCard>

          {/* FORM */}
          {creating && (
            <HolidayForm
              onSave={createHoliday}
              onCancel={() => setCreating(false)}
            />
          )}

          {/* LIST / TABLE */}
          <SectionCard className="overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5 lg:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900">
                    Holiday List
                  </h4>
                  <p className="text-sm text-slate-500">
                    {loading
                      ? "Loading holidays..."
                      : `${items.length} holiday${items.length === 1 ? "" : "s"} found`}
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <LoadingState />
            ) : (
              <>
                {/* Mobile / small tablets */}
                <div className="block lg:hidden">
                  <MobileHolidayList items={items} onDelete={remove} />
                </div>

                {/* Desktop / large screens */}
                <div className="hidden lg:block">
                  <DesktopHolidayTable items={items} onDelete={remove} />
                </div>
              </>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}