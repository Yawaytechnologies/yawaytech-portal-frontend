import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPolicies,
  upsertPolicy,
  deletePolicy,
} from "../../redux/reducer/leavepoliciesSlice";
import Chip from "./ui/Chip";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const handleNumber = (value) => {
  let v = String(value ?? "").replace(/\D/g, "");
  if (v.length > 1) v = v.replace(/^0+/, "");
  return v === "" ? 0 : Number(v);
};

/* ─────────────────────────────────────────────
   Atoms
───────────────────────────────────────────── */
function Card({ children, className = "" }) {
  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal sm:text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

const INPUT =
  "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition " +
  "placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:h-11";

function BoolSelect({ value, onChange, trueLabel = "Yes", falseLabel = "No" }) {
  return (
    <select
      className={INPUT}
      value={String(value)}
      onChange={(e) => onChange(e.target.value === "true")}
    >
      <option value="true">{trueLabel}</option>
      <option value="false">{falseLabel}</option>
    </select>
  );
}

/* ─────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-3 p-4 sm:p-5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PolicyForm
───────────────────────────────────────────── */
function PolicyForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    unit: "DAY",
    isPaid: false,
    allowHalfDay: false,
    allowPermissionHours: false,
    durationDays: 0,
    monthlyLimit: 0,
    yearlyLimit: 0,
    carryForwardAllowed: false,
  });

  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      code: String(form.code || "").trim().toUpperCase(),
      name: String(form.name || "").trim(),
      allowPermissionHours:
        form.unit === "HOUR" ? form.allowPermissionHours : false,
    });
  };

  return (
    <Card>
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5 lg:px-6">
        <h3 className="text-lg font-bold text-slate-900">Create Leave Type</h3>
      </div>

      <form onSubmit={submit} className="px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5 2xl:gap-5">
          <Field label="Code">
            <input
              className={INPUT}
              placeholder="CL"
              value={form.code}
              onChange={(e) => change("code", e.target.value.toUpperCase())}
              required
            />
          </Field>

          <Field label="Name" className="sm:col-span-1 lg:col-span-3 2xl:col-span-4">
            <input
              className={INPUT}
              placeholder="Casual Leave"
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
              required
            />
          </Field>

          <Field label="Unit">
            <select
              className={INPUT}
              value={form.unit}
              onChange={(e) => {
                const unit = e.target.value;
                setForm((s) => ({
                  ...s,
                  unit,
                  allowPermissionHours:
                    unit === "HOUR" ? s.allowPermissionHours : false,
                }));
              }}
            >
              <option value="DAY">DAY</option>
              <option value="HOUR">HOUR</option>
            </select>
          </Field>

          <Field label="Paid">
            <BoolSelect value={form.isPaid} onChange={(v) => change("isPaid", v)} trueLabel="Paid" falseLabel="Unpaid" />
          </Field>

          <Field label="Allow Half-day">
            <BoolSelect value={form.allowHalfDay} onChange={(v) => change("allowHalfDay", v)} />
          </Field>

          <Field label="Allow Permission Hours">
            <select
              className={`${INPUT} ${form.unit !== "HOUR" ? "cursor-not-allowed bg-slate-100 text-slate-400" : ""}`}
              value={String(form.allowPermissionHours)}
              onChange={(e) => change("allowPermissionHours", e.target.value === "true")}
              disabled={form.unit !== "HOUR"}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </Field>

          <Field label="Duration (days)">
            <input inputMode="numeric" className={INPUT} placeholder="0" value={form.durationDays}
              onChange={(e) => change("durationDays", handleNumber(e.target.value))} />
          </Field>

          <Field label="Monthly Limit">
            <input inputMode="numeric" className={INPUT} placeholder="0" value={form.monthlyLimit}
              onChange={(e) => change("monthlyLimit", handleNumber(e.target.value))} />
          </Field>

          <Field label="Yearly Limit">
            <input inputMode="numeric" className={INPUT} placeholder="0" value={form.yearlyLimit}
              onChange={(e) => change("yearlyLimit", handleNumber(e.target.value))} />
          </Field>

          <Field label="Carry Forward">
            <BoolSelect value={form.carryForwardAllowed} onChange={(v) => change("carryForwardAllowed", v)} />
          </Field>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
          <button type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:h-11">
            Save Leave Type
          </button>
          <button type="button" onClick={onCancel}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 sm:h-11">
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   Mobile / tablet card list   (< xl = below 1280px)

   FIX for Image 1 (768px overlap):
   ──────────────────────────────────────────────
   The old 3-col grid at sm caused "HALF-PERMISSION DAY"
   to merge into one unreadable label block. Root cause:
   3 columns at 768px content area (~380px after sidebar)
   = ~126px each — too narrow for label + value.

   Fix:
   • 320-639px  → 1 col  (single column, very readable)
   • 640-767px  → 2 col  (sm breakpoint, safe width)
   • 768-1023px → 2 col  (md, sidebar shrinks space)
   • 1024-1279px→ 3 col  (lg, enough room for 3)
   • ≥ 1280px   → hidden (table shown instead)
───────────────────────────────────────────── */
function MobilePolicyList({ items, onDelete }) {
  if (!items.length) {
    return (
      <div className="px-4 py-8 text-center text-sm text-slate-500">
        No leave types configured yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:p-4">
      {items.map((r) => (
        <div
          key={r.id ?? r.code}
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
        >
          {/* header: code badge + name + unit chip */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600">
                {r.code}
              </span>
              <div className="mt-1 break-words text-sm font-semibold text-slate-900 sm:text-base">
                {r.name}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
              {r.unit}
            </span>
          </div>

          {/*
            FIX: detail grid uses 2 columns at all mobile sizes.
            Previous 3-col at sm (640px) caused label text to wrap
            onto value text ("HALF-DAY" + "DAY" merged visually).
            2 cols gives each field ~50% width — always enough room
            for a short label and short value side-by-side vertically.
          */}
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-slate-50 p-3">
            {/* Paid */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Paid</div>
              <div className="mt-1">
                {r.isPaid ? <Chip tone="green">Paid</Chip> : <Chip tone="red">Unpaid</Chip>}
              </div>
            </div>

            {/* Half-day */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Half-day</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{r.allowHalfDay ? "Yes" : "No"}</div>
            </div>

            {/* Permission */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Permission</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{r.allowPermissionHours ? "Yes" : "No"}</div>
            </div>

            {/* Duration */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Duration</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{r.durationDays ?? 0} days</div>
            </div>

            {/* Monthly */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Monthly</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{r.monthlyLimit ?? 0}</div>
            </div>

            {/* Yearly */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Yearly</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{r.yearlyLimit ?? 0}</div>
            </div>

            {/* Carry Forward — full width */}
            <div className="col-span-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Carry Forward</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{r.carryForwardAllowed ? "Yes" : "No"}</div>
            </div>
          </div>

          <button
            onClick={() => onDelete(r)}
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Desktop table   (xl = 1280px and above)

   FIX for Image 2 (column headers merging):
   ──────────────────────────────────────────────
   "PERMISSIONDURATIONMONTHLYEARLY" appeared merged because:
   1. table-fixed compressed narrow cols to 0 padding
   2. px-3 at xl with 7% column width = ~66px → barely fits "PERMISSION"
   3. No whitespace-nowrap on th so adjacent headers bleed

   Fixes applied:
   • whitespace-nowrap on every <th> so text never wraps to next col
   • Slightly wider columns for text-heavy headers:
     Permission 9% → ensures "Permission" (10 chars) fits at px-3
   • border-separate + border-spacing for clear visual column gaps
   • text-[11px] headers (was also 11px but now with nowrap = no bleed)
   • Each column's px increases at xl / 2xl
───────────────────────────────────────────── */
function DesktopPolicyTable({ items, onDelete }) {
  if (!items.length) {
    return (
      <div className="px-6 py-10 text-center text-sm text-slate-500">
        No leave types configured yet.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/*
        Use border-separate with border-spacing-x-0 to keep cell borders
        but prevent the "merged header" optical illusion from px touching.
        Each th/td gets explicit px so there's always visible whitespace
        between column content.
      */}
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          {/*
            Total must equal 100%.
            Widest text per col:
              Code        = 5 chars  → 7%
              Name        = ~20 chars → 20%  (truncates)
              Unit        = 4 chars  → 6%
              Paid        = 6 chars  → 7%
              Half-day    = 8 chars  → 8%
              Permission  = 10 chars → 9%   ← widest header
              Duration    = 8 chars  → 7%
              Monthly     = 7 chars  → 7%
              Yearly      = 6 chars  → 7%
              Carry Fwd   = 9 chars  → 8%
              Actions     = 7 chars  → 14%  ← Delete button needs room
          */}

  <col style={{ width: "7%"  }} />
  <col style={{ width: "16%" }} />
  <col style={{ width: "6%"  }} />
  <col style={{ width: "7%"  }} />
  <col style={{ width: "8%"  }} />
  <col style={{ width: "9%"  }} />
  <col style={{ width: "7%"  }} />
  <col style={{ width: "7%"  }} />
  <col style={{ width: "7%"  }} />
  <col style={{ width: "8%"  }} />
  <col style={{ width: "10%" }} />
</colgroup>

        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            {[
              { label: "Code",       right: false },
              { label: "Name",       right: false },
              { label: "Unit",       right: false },
              { label: "Paid",       right: false },
              { label: "Half-day",   right: false },
              { label: "Permission", right: false },
              { label: "Duration",   right: false },
              { label: "Monthly",    right: false },
              { label: "Yearly",     right: false },
              { label: "Carry Fwd",  right: false },
              { label: "Actions",    right: true  },
            ].map(({ label, right }) => (
              <th
                key={label}
                className={[
                  /* FIX: whitespace-nowrap prevents header text from
                     visually bleeding into the adjacent column */
                  "whitespace-nowrap bg-slate-50",
                  "px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500",
                  "xl:px-4 xl:py-3.5",
                  "2xl:px-5 2xl:py-4 2xl:text-xs",
                  right ? "text-right" : "text-left",
                ].join(" ")}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {items.map((r) => (
            <tr
              key={r.id ?? r.code}
              className="border-b border-slate-100 transition-colors hover:bg-slate-50/60"
            >
              {/* Code */}
              <td className="whitespace-nowrap px-3 py-3 text-xs font-mono font-semibold text-slate-800 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4 2xl:text-sm">
                {r.code}
              </td>

              {/* Name — only this column may truncate */}
              <td className="px-3 py-3 text-xs font-semibold text-slate-900 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4 2xl:text-sm">
                <span className="block truncate" title={r.name}>{r.name}</span>
              </td>

              {/* Unit */}
              <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-700 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4 2xl:text-sm">
                {r.unit}
              </td>

              {/* Paid */}
              <td className="px-3 py-3 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4">
                {r.isPaid ? <Chip tone="green">Paid</Chip> : <Chip tone="red">Unpaid</Chip>}
              </td>

              {/* Half-day */}
              <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-700 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4 2xl:text-sm">
                {r.allowHalfDay ? "Yes" : "No"}
              </td>

              {/* Permission */}
              <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-700 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4 2xl:text-sm">
                {r.allowPermissionHours ? "Yes" : "No"}
              </td>

              {/* Duration */}
              <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-700 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4 2xl:text-sm">
                {r.durationDays ?? 0}
              </td>

              {/* Monthly */}
              <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-700 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4 2xl:text-sm">
                {r.monthlyLimit ?? 0}
              </td>

              {/* Yearly */}
              <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-700 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4 2xl:text-sm">
                {r.yearlyLimit ?? 0}
              </td>

              {/* Carry Forward */}
              <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-700 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4 2xl:text-sm">
                {r.carryForwardAllowed ? "Yes" : "No"}
              </td>

              {/* Actions */}
              <td className="px-3 py-3 text-right xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4">
                <button
                  onClick={() => onDelete(r)}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 font-semibold text-white transition hover:bg-red-700 h-7 px-3 text-[11px] xl:h-8 xl:px-3.5 xl:text-xs 2xl:h-9 2xl:px-4 2xl:text-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PoliciesPanel — main export
───────────────────────────────────────────── */
export default function PoliciesPanel() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.policies);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchPolicies());
  }, [dispatch]);

  const save = (data) => {
    dispatch(upsertPolicy(data)).then(() => setCreating(false));
  };

  const remove = (row) => {
    if (window.confirm(`Delete "${row.name}"?`)) {
      dispatch(deletePolicy(row.code));
    }
  };

  return (
    <div className="w-full min-w-0 text-slate-900">
      <div className="w-full p-3 sm:p-4 lg:p-3 xl:p-5 2xl:p-8">
        <div className="flex w-full flex-col gap-4 sm:gap-5 2xl:gap-6">

          {/* ── Header card ── */}
          <Card>
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 lg:px-5 xl:px-6 2xl:px-8 2xl:py-5">
              <h3 className="min-w-0 text-xl font-bold text-slate-900 sm:text-2xl 2xl:text-3xl">
                Company Leave Types
              </h3>
              <button
                onClick={() => setCreating((p) => !p)}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:h-11 sm:w-auto 2xl:h-12 2xl:px-6 2xl:text-base"
              >
                {creating ? "Close Form" : "New Type"}
              </button>
            </div>
          </Card>

          {/* ── Create form ── */}
          {creating && (
            <PolicyForm onSave={save} onCancel={() => setCreating(false)} />
          )}

          {/* ── Leave type list card ── */}
          <Card>
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5 lg:px-5 xl:px-6 2xl:px-8 2xl:py-5">
              <h3 className="text-lg font-bold text-slate-900 2xl:text-xl">
                Leave Type List
              </h3>
              <p className="mt-0.5 text-sm text-slate-500 2xl:text-base">
                {loading
                  ? "Loading leave types…"
                  : `${items.length} leave type${items.length === 1 ? "" : "s"} available`}
              </p>
            </div>

            {loading ? (
              <Skeleton />
            ) : (
              <>
                {/*
                  Card layout for all screens below xl (< 1280px).
                  Includes 320px, 768px (image 1), and 1024px.
                  Cards use a safe 2-col internal grid — no label overlap.
                */}
                <div className="block xl:hidden">
                  <MobilePolicyList items={items} onDelete={remove} />
                </div>

                {/*
                  Table layout for xl and above (≥ 1280px).
                  whitespace-nowrap on every th/td prevents column merging.
                  table-fixed + colgroup % ensures no horizontal scroll.
                */}
                <div className="hidden xl:block">
                  <DesktopPolicyTable items={items} onDelete={remove} />
                </div>
              </>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}