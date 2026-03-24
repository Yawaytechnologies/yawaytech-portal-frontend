import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { IoCloseSharp } from "react-icons/io5";
import { MdAdd } from "react-icons/md";

import {
  fetchShiftTypes,
  assignShiftToEmployee,
  fetchDepartmentEmployees,
} from "../redux/actions/shiftTypeActions";
import {
  clearShiftTypeMessages,
  clearDepartmentEmployees,
} from "../redux/reducer/shiftTypeSlice";

const DEPARTMENTS = ["HR", "IT", "MARKETING", "FINANCE", "SALES"];

const INITIAL_FORM = {
  department: "",
  employee_ids: [],
  shift_id: "",
  effective_from: "",
  effective_to: "",
};

function isValidISODate(iso) {
  if (!iso) return false;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]),
    mon = Number(m[2]),
    day = Number(m[3]);
  if (!Number.isFinite(y) || y < 1000 || y > 9999) return false;
  if (mon < 1 || mon > 12) return false;
  const dim = new Date(Date.UTC(y, mon, 0)).getUTCDate();
  return day >= 1 && day <= dim;
}

function shortTime(t) {
  if (!t) return "-";
  const s = String(t);
  const m = s.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : s;
}

/* ── Reusable field classes ────────────────────────────────────────── */
const fieldCls = [
  "w-full",
  "h-10 sm:h-11 xl:h-12 2xl:h-14",
  "rounded-xl border border-white/10",
  "bg-white/5 px-3 sm:px-4",
  "text-xs sm:text-sm xl:text-base 2xl:text-lg",
  "text-white outline-none",
  "focus:border-[#FF5800]/60 focus:ring-1 focus:ring-[#FF5800]/30 transition",
].join(" ");

const labelCls =
  "block mb-1 sm:mb-1.5 text-[11px] sm:text-sm font-medium text-white/70 xl:text-base 2xl:text-lg";

export default function DepartmentShift() {
  const dispatch = useDispatch();
  const fetchedRef = useRef(false);

  const {
    items,
    loading,
    assigning,
    employees,
    employeesLoading,
    employeesError,
    error,
  } = useSelector((s) => s.shiftType);

  const [open, setOpen] = useState(false);
  const [submittingBatch, setSubmittingBatch] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    dispatch(fetchShiftTypes());
  }, [dispatch]);

  useEffect(() => {
    if (!form.department) {
      dispatch(clearDepartmentEmployees());
      return;
    }
    dispatch(fetchDepartmentEmployees(form.department));
  }, [form.department, dispatch]);

  useEffect(() => {
    if (!successText) return;
    const t = setTimeout(() => {
      setSuccessText("");
      dispatch(clearShiftTypeMessages());
    }, 1800);
    return () => clearTimeout(t);
  }, [successText, dispatch]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const shifts = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const allSelected =
    employees.length > 0 && form.employee_ids.length === employees.length;

  const toggleEmployee = (employeeId) => {
    const id = String(employeeId || "");
    if (!id) return;
    setForm((prev) => ({
      ...prev,
      employee_ids: prev.employee_ids.includes(id)
        ? prev.employee_ids.filter((x) => x !== id)
        : [...prev.employee_ids, id],
    }));
  };

  const toggleAllEmployees = () =>
    setForm((prev) => ({
      ...prev,
      employee_ids: allSelected
        ? []
        : employees
            .map((e) => e?.employee_id)
            .filter(Boolean)
            .map(String),
    }));

  const onOpenAssign = () => {
    dispatch(clearShiftTypeMessages());
    setForm(INITIAL_FORM);
    setOpen(true);
  };

  const onCloseModal = () => {
    setOpen(false);
    setForm(INITIAL_FORM);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearShiftTypeMessages());
    setSuccessText("");

    if (!form.department) {
      alert("Department is required");
      return;
    }
    if (!form.employee_ids.length) {
      alert("Select at least one employee");
      return;
    }
    if (!form.shift_id) {
      alert("Shift is required");
      return;
    }
    if (!form.effective_from || !form.effective_to) {
      alert("Effective From and Effective To are required");
      return;
    }
    if (
      !isValidISODate(form.effective_from) ||
      !isValidISODate(form.effective_to)
    ) {
      alert("Invalid date. Use YYYY-MM-DD");
      return;
    }
    if (form.effective_to < form.effective_from) {
      alert("Effective To must be same or after Effective From");
      return;
    }

    let appliedCount = 0;
    setSubmittingBatch(true);
    try {
      for (const employeeId of form.employee_ids) {
        await dispatch(
          assignShiftToEmployee({
            employee_id: String(employeeId),
            shift_id: Number(form.shift_id),
            effective_from: form.effective_from,
            effective_to: form.effective_to,
          }),
        ).unwrap();
        appliedCount += 1;
      }
      setSuccessText(
        `Shift applied successfully to ${appliedCount} employee${appliedCount > 1 ? "s" : ""}.`,
      );
      setOpen(false);
      setForm(INITIAL_FORM);
      dispatch(fetchShiftTypes());
    } catch (err) {
      if (appliedCount > 0) {
        alert(
          `Shift applied to ${appliedCount} employee${appliedCount > 1 ? "s" : ""}, but one or more assignments failed.`,
        );
      } else {
        alert(
          typeof err === "string"
            ? err
            : err?.message || "Failed to apply shift",
        );
      }
    } finally {
      setSubmittingBatch(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     MODAL
     • Overlay: fixed inset-0, flex center, padding so card never
       touches screen edges (even on 375 px phones)
     • Card: centered, max-w scales across every breakpoint, auto
       height — grows with content, never needs its own scrollbar
     • Only the employee checkbox list has a capped max-h so the
       card stays compact regardless of how many employees exist
  ══════════════════════════════════════════════════════════════════ */
  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-5 md:p-6 xl:p-8"
      onMouseDown={onCloseModal}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-[340px] sm:max-w-[540px] md:max-w-[660px] lg:max-w-[780px] xl:max-w-[860px] 2xl:max-w-[960px] max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-40px)] md:max-h-[calc(100dvh-48px)] xl:max-h-[calc(100dvh-64px)] flex flex-col rounded-2xl xl:rounded-3xl border border-white/10 bg-[#0e1b34] shadow-2xl"
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4 md:px-6 xl:px-8 xl:py-5 2xl:px-10 2xl:py-6">
          <h2 className="text-sm font-extrabold tracking-wide sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl">
            Assign Department Shift
          </h2>
          <button
            onClick={onCloseModal}
            type="button"
            className="inline-flex shrink-0 items-center justify-center h-8 w-8 sm:h-9 sm:w-9 xl:h-11 xl:w-11 2xl:h-12 2xl:w-12 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            <IoCloseSharp className="text-sm sm:text-base xl:text-xl 2xl:text-2xl" />
          </button>
        </div>

        {/* ── Form ───────────────────────────────────────────────── */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          {/* ── Scrollable fields area ──────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 md:px-6 xl:px-8 xl:py-6 2xl:px-10 2xl:py-7">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:gap-5">
              <div>
                <label className={labelCls}>Department</label>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      department: e.target.value,
                      employee_ids: [],
                      shift_id: "",
                    }))
                  }
                  className={fieldCls}
                >
                  <option value="" className="text-black">
                    Select Department
                  </option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d} className="text-black">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Shift</label>
                <select
                  value={form.shift_id}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, shift_id: e.target.value }))
                  }
                  className={fieldCls}
                >
                  <option value="" className="text-black">
                    Select Shift
                  </option>
                  {items.map((s) => (
                    <option key={s?.id} value={s?.id} className="text-black">
                      {s?.name} ({shortTime(s?.start_time)} -{" "}
                      {shortTime(s?.end_time)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2 — Effective dates */}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4 2xl:gap-5">
              <div>
                <label className={labelCls}>Effective From</label>
                <input
                  type="date"
                  value={form.effective_from}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      effective_from: e.target.value,
                    }))
                  }
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Effective To</label>
                <input
                  type="date"
                  value={form.effective_to}
                  min={form.effective_from || undefined}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      effective_to: e.target.value,
                    }))
                  }
                  className={fieldCls}
                />
              </div>
            </div>

            {/* Row 3 — Employees */}
            <div className="mt-3 sm:mt-4">
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <span className={labelCls}>Employees</span>
                <span className="text-[10px] sm:text-xs text-white/50 xl:text-sm 2xl:text-base">
                  Selected: {form.employee_ids.length}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                {/* Select All bar */}
                <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 xl:px-5 xl:py-3 2xl:px-6 2xl:py-3.5 border-b border-white/10">
                  <label className="inline-flex items-center gap-2 sm:gap-3 cursor-pointer text-[11px] sm:text-sm text-white/80 xl:text-base 2xl:text-lg">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAllEmployees}
                      disabled={
                        !form.department ||
                        employeesLoading ||
                        !employees.length
                      }
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 accent-[#FF5800]"
                    />
                    Select All
                  </label>
                  <span className="text-[10px] sm:text-xs text-white/50 xl:text-sm 2xl:text-base">
                    {!form.department
                      ? "Select department first"
                      : employeesLoading
                        ? "Loading…"
                        : `${employees.length} employee${employees.length !== 1 ? "s" : ""}`}
                  </span>
                </div>

                {/* Scrollable employee grid */}
                <div className="overflow-y-auto max-h-[35vh] p-2 sm:p-3 xl:p-4 2xl:p-5">
                  {!form.department ? (
                    <p className="text-[11px] sm:text-sm text-white/40 xl:text-base 2xl:text-lg">
                      Select a department to see employees.
                    </p>
                  ) : employeesLoading ? (
                    <p className="text-[11px] sm:text-sm text-white/40 xl:text-base 2xl:text-lg">
                      Loading employees…
                    </p>
                  ) : employees.length === 0 ? (
                    <p className="text-[11px] sm:text-sm text-white/40 xl:text-base 2xl:text-lg">
                      No employees found for this department.
                    </p>
                  ) : (
                    <div className="grid gap-1.5 sm:gap-2 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 2xl:gap-3">
                      {employees.map((emp) => {
                        const employeeId = String(emp?.employee_id || "");
                        const checked = form.employee_ids.includes(employeeId);
                        return (
                          <label
                            key={employeeId || emp?.name}
                            className={[
                              "flex items-center gap-2 sm:gap-2.5 cursor-pointer",
                              "rounded-xl border px-2 py-2 sm:px-3 sm:py-2.5 xl:px-4 xl:py-3 2xl:px-5 2xl:py-3.5",
                              "transition",
                              checked
                                ? "border-[#FF5800]/50 bg-[#FF5800]/10"
                                : "border-white/10 bg-white/5 hover:bg-white/[0.09]",
                            ].join(" ")}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleEmployee(employeeId)}
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 accent-[#FF5800]"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[11px] sm:text-sm font-semibold text-white xl:text-base 2xl:text-lg">
                                {emp?.name || "Employee"}
                              </p>
                              <p className="text-[10px] sm:text-xs text-white/50 xl:text-sm 2xl:text-base">
                                {employeeId || "-"}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* end scrollable area */}

          {/* ── Sticky footer buttons — always visible ──────────── */}
          <div className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-5 sm:py-4 md:px-6 xl:px-8 2xl:px-10 flex items-center justify-end gap-2 sm:gap-3 2xl:gap-4">
            <button
              type="button"
              onClick={onCloseModal}
              className="h-9 sm:h-10 xl:h-11 2xl:h-12 min-w-[84px] sm:min-w-[110px] xl:min-w-[130px] 2xl:min-w-[160px] rounded-xl border border-white/10 bg-white/10 px-3 sm:px-4 text-xs sm:text-sm font-semibold xl:text-base 2xl:text-lg hover:bg-white/15 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assigning || submittingBatch}
              className="h-9 sm:h-10 xl:h-11 2xl:h-12 min-w-[110px] sm:min-w-[150px] xl:min-w-[170px] 2xl:min-w-[210px] rounded-xl bg-[#FF5800] px-3 sm:px-4 text-xs sm:text-sm font-extrabold xl:text-base 2xl:text-lg hover:brightness-110 disabled:opacity-60 transition"
            >
              {assigning || submittingBatch ? "Applying…" : "Apply Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     PAGE
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen w-full px-2 py-2 text-white sm:px-3 sm:py-3 md:px-4 md:py-4 xl:px-5 2xl:px-6">
      <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1830] via-[#17264f] to-[#24386e] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        {/* Page header */}
        <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 md:px-6 lg:px-7 2xl:px-8 2xl:py-5">
          <h1 className="text-xl font-extrabold leading-none tracking-wide sm:text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl">
            Department Shift
          </h1>
          <button
            onClick={onOpenAssign}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#FF5800] px-4 text-xs font-bold hover:brightness-110 transition sm:h-10 sm:w-auto sm:text-sm md:h-11 md:px-5 2xl:h-12 2xl:px-6 2xl:text-base"
            type="button"
          >
            <MdAdd className="text-base sm:text-lg 2xl:text-xl" />
            Assign Shift
          </button>
        </div>

        {/* Alerts */}
        {(error || employeesError || successText) && (
          <div className="space-y-2 border-b border-white/10 px-4 py-3 sm:px-5 md:px-6 lg:px-7 2xl:px-8">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-200 sm:px-4 sm:text-sm 2xl:text-base">
                {String(error)}
              </div>
            )}
            {employeesError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-200 sm:px-4 sm:text-sm 2xl:text-base">
                {String(employeesError)}
              </div>
            )}
            {successText && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-200 sm:px-4 sm:text-sm 2xl:text-base">
                {successText}
              </div>
            )}
          </div>
        )}

        {/* Shift list */}
        <div className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-7 2xl:px-8 2xl:py-5">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/70 2xl:text-lg">
              Loading shifts…
            </div>
          ) : shifts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/60 2xl:text-lg">
              No shifts found.
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-4 py-3 sm:px-5 2xl:px-6">
                <h2 className="text-sm font-semibold text-white/80 sm:text-base 2xl:text-lg">
                  Shift List
                </h2>
              </div>

              {/* Mobile cards (< md) */}
              <div className="block md:hidden space-y-2.5 p-3 sm:p-4">
                {shifts.map((x) => (
                  <div
                    key={x?.id || `${x?.name}-${x?.start_time}-${x?.end_time}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-white">
                          {x?.name || "-"}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-white/60">
                          ID: {x?.id ?? "-"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          x?.is_night
                            ? "border border-amber-400/20 bg-amber-500/15 text-amber-200"
                            : "border border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                        }`}
                      >
                        {x?.is_night ? "Night" : "Day"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: "Start", value: shortTime(x?.start_time) },
                        { label: "End", value: shortTime(x?.end_time) },
                        { label: "Hours", value: x?.total_hours ?? 0 },
                        { label: "Night", value: x?.is_night ? "Yes" : "No" },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="rounded-xl bg-white/5 px-2.5 py-2"
                        >
                          <p className="text-[10px] text-white/50">{label}</p>
                          <p className="mt-0.5 font-semibold text-white/90">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table (≥ md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm 2xl:text-base">
                  <thead className="bg-white/5">
                    <tr className="text-left text-white/80">
                      {["ID", "Name", "Start", "End", "Hours", "Night"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((x) => (
                      <tr
                        key={
                          x?.id || `${x?.name}-${x?.start_time}-${x?.end_time}`
                        }
                        className="border-t border-white/10 text-white/85 transition-colors hover:bg-white/[0.04]"
                      >
                        <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                          {x?.id ?? "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                          {x?.name || "-"}
                        </td>
                        <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                          {shortTime(x?.start_time)}
                        </td>
                        <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                          {shortTime(x?.end_time)}
                        </td>
                        <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                          {x?.total_hours ?? 0}
                        </td>
                        <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold 2xl:text-sm ${
                              x?.is_night
                                ? "border border-amber-400/20 bg-amber-500/15 text-amber-200"
                                : "border border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                            }`}
                          >
                            {x?.is_night ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {open && createPortal(modal, document.body)}
    </div>
  );
}
