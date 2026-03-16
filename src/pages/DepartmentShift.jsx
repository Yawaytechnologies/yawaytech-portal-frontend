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

  const y = Number(m[1]);
  const mon = Number(m[2]);
  const day = Number(m[3]);

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

  const shifts = useMemo(() => {
    return Array.isArray(items) ? items : [];
  }, [items]);

  const allSelected =
    employees.length > 0 && form.employee_ids.length === employees.length;

  const toggleEmployee = (employeeId) => {
    const id = String(employeeId || "");
    if (!id) return;

    setForm((prev) => {
      const exists = prev.employee_ids.includes(id);
      return {
        ...prev,
        employee_ids: exists
          ? prev.employee_ids.filter((x) => x !== id)
          : [...prev.employee_ids, id],
      };
    });
  };

  const toggleAllEmployees = () => {
    setForm((prev) => ({
      ...prev,
      employee_ids: allSelected
        ? []
        : employees
            .map((emp) => emp?.employee_id)
            .filter(Boolean)
            .map(String),
    }));
  };

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
        `Shift applied successfully to ${appliedCount} employee${
          appliedCount > 1 ? "s" : ""
        }.`,
      );

      setOpen(false);
      setForm(INITIAL_FORM);
      dispatch(fetchShiftTypes());
    } catch (err) {
      if (appliedCount > 0) {
        alert(
          `Shift applied to ${appliedCount} employee${
            appliedCount > 1 ? "s" : ""
          }, but one or more assignments failed.`,
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

  const modal = (
    <div
      className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm"
      onMouseDown={onCloseModal}
    >
      <div className="flex min-h-[100dvh] w-full items-end justify-center p-0 sm:items-center sm:p-4 md:p-6 xl:p-8">
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="mx-auto flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border border-white/10 bg-[#0e1b34] shadow-2xl sm:h-auto sm:max-h-[92vh] sm:w-full sm:max-w-[92vw] sm:rounded-3xl md:max-w-[920px] lg:max-w-[1040px] xl:max-w-[1120px] 2xl:max-w-[1180px]"
        >
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/10 bg-[#0e1b34] px-4 py-4 sm:px-5 md:px-6 2xl:px-7">
            <div className="min-w-0 pr-3">
              <h2 className="text-base font-extrabold sm:text-lg lg:text-xl 2xl:text-2xl">
                Assign Department Shift
              </h2>
              <p className="mt-1 text-xs text-white/55 sm:text-sm 2xl:text-base">
                Apply one shift to one or more employees.
              </p>
            </div>

            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 2xl:h-12 2xl:w-12"
              onClick={onCloseModal}
              type="button"
            >
              <IoCloseSharp className="text-xl 2xl:text-2xl" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6 2xl:gap-8">
                <div>
                  <label className="text-sm text-white/80 2xl:text-base">
                    Department
                  </label>
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
                    className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none sm:h-12 2xl:h-14 2xl:text-base"
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
                  <label className="text-sm text-white/80 2xl:text-base">
                    Shift
                  </label>
                  <select
                    value={form.shift_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        shift_id: e.target.value,
                      }))
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none sm:h-12 2xl:h-14 2xl:text-base"
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

                <div className="lg:col-span-2">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm text-white/80 2xl:text-base">
                      Employees
                    </label>
                    <span className="text-xs text-white/50 2xl:text-sm">
                      Selected: {form.employee_ids.length}
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                      <label className="inline-flex items-center gap-3 text-sm text-white/85 2xl:text-base">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAllEmployees}
                          disabled={
                            !form.department ||
                            employeesLoading ||
                            !employees.length
                          }
                          className="h-4 w-4"
                        />
                        Select All
                      </label>

                      <span className="text-xs text-white/50 2xl:text-sm">
                        {!form.department
                          ? "Select department first"
                          : employeesLoading
                            ? "Loading employees..."
                            : `${employees.length} employee${
                                employees.length !== 1 ? "s" : ""
                              }`}
                      </span>
                    </div>

                    <div className="max-h-[220px] overflow-y-auto p-3 sm:max-h-[260px] lg:max-h-[320px] 2xl:max-h-[380px]">
                      {!form.department ? (
                        <div className="rounded-xl bg-white/5 px-4 py-6 text-sm text-white/55 2xl:text-base">
                          Select department first.
                        </div>
                      ) : employeesLoading ? (
                        <div className="rounded-xl bg-white/5 px-4 py-6 text-sm text-white/55 2xl:text-base">
                          Loading employees...
                        </div>
                      ) : employees.length === 0 ? (
                        <div className="rounded-xl bg-white/5 px-4 py-6 text-sm text-white/55 2xl:text-base">
                          No employees found for this department.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {employees.map((emp) => {
                            const employeeId = String(emp?.employee_id || "");
                            const checked =
                              form.employee_ids.includes(employeeId);

                            return (
                              <label
                                key={employeeId || emp?.name}
                                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition 2xl:px-5 2xl:py-4 ${
                                  checked
                                    ? "border-[#FF5800]/50 bg-[#FF5800]/10"
                                    : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleEmployee(employeeId)}
                                  className="mt-1 h-4 w-4 shrink-0"
                                />

                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-white 2xl:text-base">
                                    {emp?.name || "Employee"}
                                  </div>
                                  <div className="mt-1 text-xs text-white/55 2xl:text-sm">
                                    {employeeId || "-"}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/80 2xl:text-base">
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={form.effective_from}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        effective_from: e.target.value,
                      }))
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none sm:h-12 2xl:h-14 2xl:text-base"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/80 2xl:text-base">
                    Effective To
                  </label>
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
                    className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none sm:h-12 2xl:h-14 2xl:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 border-t border-white/10 bg-[#0e1b34] px-4 py-4 sm:px-5 md:px-6 2xl:px-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 sm:w-auto sm:min-w-[130px] 2xl:h-14 2xl:min-w-[160px] 2xl:text-base"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={assigning || submittingBatch}
                  className="w-full rounded-xl bg-[#FF5800] px-4 py-3 text-sm font-extrabold hover:brightness-110 disabled:opacity-60 sm:w-auto sm:min-w-[180px] 2xl:h-14 2xl:min-w-[220px] 2xl:text-base"
                >
                  {assigning || submittingBatch ? "Applying..." : "Apply Shift"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full px-2 py-2 text-white sm:px-3 sm:py-3 md:px-4 md:py-4 xl:px-5 2xl:px-6">
      <div className="w-full max-w-none overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1830] via-[#17264f] to-[#24386e] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <div className="border-b border-white/10 px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-7 2xl:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-none tracking-wide sm:text-3xl lg:text-4xl 2xl:text-5xl">
                Department Shift
              </h1>
              <p className="mt-1 text-xs text-white/55 sm:text-sm 2xl:text-base">
                Apply shifts to one or more employees by department.
              </p>
            </div>

            <button
              onClick={onOpenAssign}
              className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FF5800] px-4 text-sm font-bold hover:brightness-110 sm:h-11 sm:w-auto md:h-12 md:px-5 2xl:h-14 2xl:px-6 2xl:text-base"
              type="button"
            >
              <MdAdd className="text-lg 2xl:text-xl" />
              Assign Shift
            </button>
          </div>
        </div>

        {(error || employeesError || successText) && (
          <div className="border-b border-white/10 px-4 py-3 sm:px-5 md:px-6 lg:px-7 2xl:px-8">
            <div className="space-y-2">
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 2xl:text-base">
                  {String(error)}
                </div>
              )}

              {employeesError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 2xl:text-base">
                  {String(employeesError)}
                </div>
              )}

              {successText && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 2xl:text-base">
                  {successText}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-7 2xl:px-8">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-sm text-white/70 sm:px-5 2xl:text-lg">
              Loading shifts...
            </div>
          ) : shifts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-sm text-white/60 sm:px-5 2xl:text-lg">
              No shifts found.
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-4 py-3 sm:px-5 2xl:px-6">
                <h2 className="text-sm font-semibold text-white/80 sm:text-base 2xl:text-lg">
                  Shift List
                </h2>
              </div>

              <div className="block md:hidden">
                <div className="space-y-3 p-3 sm:p-4">
                  {shifts.map((x) => (
                    <div
                      key={
                        x?.id || `${x?.name}-${x?.start_time}-${x?.end_time}`
                      }
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-white sm:text-lg">
                            {x?.name || "-"}
                          </h3>
                          <p className="mt-1 text-xs text-white/60">
                            ID: {x?.id ?? "-"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                            x?.is_night
                              ? "border border-amber-400/20 bg-amber-500/15 text-amber-200"
                              : "border border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                          }`}
                        >
                          {x?.is_night ? "Night" : "Day"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[11px] text-white/50">Start</p>
                          <p className="mt-1 font-semibold text-white/90">
                            {shortTime(x?.start_time)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[11px] text-white/50">End</p>
                          <p className="mt-1 font-semibold text-white/90">
                            {shortTime(x?.end_time)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[11px] text-white/50">Hours</p>
                          <p className="mt-1 font-semibold text-white/90">
                            {x?.total_hours ?? 0}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[11px] text-white/50">Night</p>
                          <p className="mt-1 font-semibold text-white/90">
                            {x?.is_night ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm 2xl:text-base">
                  <thead className="bg-white/5">
                    <tr className="text-left text-white/80">
                      <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                        ID
                      </th>
                      <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                        Name
                      </th>
                      <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                        Start
                      </th>
                      <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                        End
                      </th>
                      <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                        Hours
                      </th>
                      <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                        Night
                      </th>
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
