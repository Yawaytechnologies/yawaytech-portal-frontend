// src/components/Leave/PoliciesPanel.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPolicies,
  upsertPolicy,
  deletePolicy,
  publishPolicies,
} from "../../redux/reducer/leavepoliciesSlice";
import Chip from "./ui/Chip";

/* ----------------------------- Form ----------------------------- */

function PolicyForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    () =>
      initial ?? {
        code: "",
        name: "",
        unit: "DAY", // "DAY" | "HOUR"
        isPaid: false,
        allowHalfDay: false,
        allowPermissionHours: false,
        durationDays: 0,
        monthlyLimit: 0,
        yearlyLimit: 0,
        carryForwardAllowed: false,
      }
  );

  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const inputCls =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none " +
    "focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400";

  const boolSelect = (value, onChange) => (
    <select
      className={inputCls}
      value={String(value)}
      onChange={(e) => onChange(e.target.value === "true")}
    >
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  );

  return (
    <form onSubmit={submit} className="grid gap-4 text-slate-900">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Code */}
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-700 sm:text-sm">
            Code
          </span>
          <input
            className={inputCls}
            value={form.code}
            onChange={(e) => change("code", e.target.value.toUpperCase())}
            required
          />
        </label>

        {/* Name */}
        <label className="grid gap-1 md:col-span-2">
          <span className="text-xs font-medium text-slate-700 sm:text-sm">
            Name
          </span>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => change("name", e.target.value)}
            required
          />
        </label>

        {/* Unit */}
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-700 sm:text-sm">
            Unit
          </span>
          <select
            className={inputCls}
            value={form.unit}
            onChange={(e) => {
              const nextUnit = e.target.value;
              setForm((s) => ({
                ...s,
                unit: nextUnit,
                allowPermissionHours:
                  nextUnit === "HOUR" ? s.allowPermissionHours : false,
              }));
            }}
          >
            <option value="DAY">DAY</option>
            <option value="HOUR">HOUR</option>
          </select>
        </label>

        {/* Paid */}
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-700 sm:text-sm">
            Paid
          </span>
          {boolSelect(form.isPaid, (v) => change("isPaid", v))}
        </label>

        {/* Allow Half-day */}
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-700 sm:text-sm">
            Allow Half-day
          </span>
          {boolSelect(form.allowHalfDay, (v) => change("allowHalfDay", v))}
        </label>

        {/* Allow Permission Hours */}
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-700 sm:text-sm">
            Allow Permission Hours
          </span>
          <select
            className={inputCls}
            value={String(form.allowPermissionHours)}
            onChange={(e) =>
              change("allowPermissionHours", e.target.value === "true")
            }
            disabled={form.unit !== "HOUR"}
          >
            <option value="false">No</option>
            <option value="true">Yes (only for HOUR unit)</option>
          </select>
        </label>

        {/* Duration (fixed days for this type, if any) */}
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-700 sm:text-sm">
            Duration (days)
          </span>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.durationDays}
            onChange={(e) =>
              change("durationDays", Number(e.target.value) || 0)
            }
          />
        </label>

        {/* Monthly limit */}
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-700 sm:text-sm">
            Monthly Limit
          </span>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.monthlyLimit}
            onChange={(e) =>
              change("monthlyLimit", Number(e.target.value) || 0)
            }
          />
        </label>

        {/* Yearly limit */}
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-700 sm:text-sm">
            Yearly Limit
          </span>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.yearlyLimit}
            onChange={(e) =>
              change("yearlyLimit", Number(e.target.value) || 0)
            }
          />
        </label>

        {/* Carry forward allowed */}
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-700 sm:text-sm">
            Carry Forward
          </span>
          {boolSelect(form.carryForwardAllowed, (v) =>
            change("carryForwardAllowed", v)
          )}
        </label>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 sm:text-sm"
          type="submit"
        >
          Save
        </button>
        <button
          className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-900 hover:bg-slate-200 sm:text-sm"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ---------------------------- Panel ---------------------------- */

export default function PoliciesPanel() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.policies);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchPolicies());
  }, [dispatch]);

  const save = (data) => {
    const payload = editing ? { ...data, id: editing.id } : data;
    dispatch(upsertPolicy(payload)).then(() => {
      setEditing(null);
      setCreating(false);
    });
  };

  const remove = (row) => {
    if (window.confirm(`Delete ${row.name}?`)) {
      dispatch(deletePolicy(row.code));
    }
  };

  const publish = () =>
    dispatch(publishPolicies()).then((r) =>
      alert(
        `Policies published at ${new Date(
          r.payload.publishedAt
        ).toLocaleString()}`
      )
    );

  return (
    <div className="grid gap-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold sm:text-xl">
            Company Leave Types
          </h3>
          <p className="text-xs text-slate-600 sm:text-sm">
            Configure units (day/hour), paid/unpaid, limits, and carry-forward
            rules for each leave type.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-900 hover:bg-slate-200 sm:w-auto sm:text-sm"
            onClick={publish}
          >
            Publish
          </button>
          <button
            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 sm:w-auto sm:text-sm"
            onClick={() => setCreating(true)}
          >
            New Type
          </button>
        </div>
      </div>

      {/* Form */}
      {(creating || editing) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <PolicyForm
            initial={editing ?? undefined}
            onSave={save}
            onCancel={() => {
              setEditing(null);
              setCreating(false);
            }}
          />
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-800">
            <tr>
              <th className="p-2 text-left font-semibold">Code</th>
              <th className="p-2 text-left font-semibold">Name</th>
              <th className="p-2 text-left font-semibold">Unit</th>
              <th className="p-2 text-left font-semibold">Paid</th>
              <th className="hidden p-2 text-left font-semibold sm:table-cell">
                Half-day
              </th>
              <th className="hidden p-2 text-left font-semibold md:table-cell">
                Permission Hours
              </th>
              <th className="hidden p-2 text-left font-semibold md:table-cell">
                Duration (days)
              </th>
              <th className="hidden p-2 text-left font-semibold lg:table-cell">
                Monthly Limit
              </th>
              <th className="hidden p-2 text-left font-semibold lg:table-cell">
                Yearly Limit
              </th>
              <th className="hidden p-2 text-left font-semibold lg:table-cell">
                Carry Forward
              </th>
              <th className="p-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-900">
            {loading ? (
              <tr>
                <td className="p-4 text-center" colSpan={11}>
                  Loading…
                </td>
              </tr>
            ) : items.length ? (
              items.map((r) => (
                <tr
                  key={r.id ?? r.code}
                  className="border-b border-slate-200 last:border-none"
                >
                  <td className="p-2 font-mono">{r.code}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.unit}</td>
                  <td className="p-2">
                    {r.isPaid ? (
                      <Chip tone="green">Paid</Chip>
                    ) : (
                      <Chip tone="red">Unpaid</Chip>
                    )}
                  </td>
                  <td className="hidden p-2 sm:table-cell">
                    {r.allowHalfDay ? "Yes" : "No"}
                  </td>
                  <td className="hidden p-2 md:table-cell">
                    {r.allowPermissionHours ? "Yes" : "No"}
                  </td>
                  <td className="hidden p-2 md:table-cell">
                    {r.durationDays}
                  </td>
                  <td className="hidden p-2 lg:table-cell">
                    {r.monthlyLimit}
                  </td>
                  <td className="hidden p-2 lg:table-cell">
                    {r.yearlyLimit}
                  </td>
                  <td className="hidden p-2 lg:table-cell">
                    {r.carryForwardAllowed ? "Yes" : "No"}
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <button
                        className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-900 hover:bg-slate-200 sm:text-xs"
                        onClick={() => setEditing(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg bg-red-600 px-2 py-1 text-[11px] text-white hover:bg-red-700 sm:text-xs"
                        onClick={() => remove(r)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-4 text-center" colSpan={11}>
                  No leave types configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
