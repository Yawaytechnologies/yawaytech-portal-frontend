// src/pages/Shift.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { IoCloseSharp } from "react-icons/io5";
import { MdAdd, MdRefresh } from "react-icons/md";

import { fetchShiftTypes, addShiftType } from "../redux/actions/shiftTypeActions";
import { clearShiftTypeMessages } from "../redux/reducer/shiftTypeSlice";

function hhmmToApiTime(hhmm) {
  if (!hhmm || !hhmm.includes(":")) return "00:00:00.000Z";
  const [h, m] = hhmm.split(":");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`;
}

function calcHours(startHHMM, endHHMM) {
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);

  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  let diff = end - start;
  if (diff < 0) diff += 24 * 60;

  return Math.round((diff / 60) * 100) / 100;
}

function shortTime(t) {
  if (!t) return "-";
  const s = String(t);
  const m = s.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : s;
}

const DEPARTMENTS = ["HR", "IT", "MARKETING", "FINANCE", "SALES"];

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://yawaytech-portal-backend-python-2.onrender.com",
});

export default function Shift() {
  const dispatch = useDispatch();

  const { items, loading, creating, error, success } = useSelector(
    (s) => s.shiftType,
  );

  const token =
    useSelector((s) => s?.auth?.token) || useSelector((s) => s?.authSession?.token);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  // dropdown open states
  const [shiftNameOpen, setShiftNameOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [empOpen, setEmpOpen] = useState(false);

  // employee list cache by department
  const [empCache, setEmpCache] = useState({}); // { IT:[...], HR:[...] }
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState(null);

  // ✅ ONLY "Select All" is needed => use draft boolean + Apply button
  const [empSelectAllDraft, setEmpSelectAllDraft] = useState(false);

  const [form, setForm] = useState({
    name: "",
    department: "",
    employee_ids: [], // ✅ stores all employee ids when Select All applied
    start_time: "06:00",
    end_time: "14:00",
    total_hours: 8,
    is_night: false,
  });

  const getEmpId = (e) =>
    e?.employee_id || e?.employeeId || e?.code || e?.id || "";

  useEffect(() => {
    dispatch(fetchShiftTypes());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => dispatch(clearShiftTypeMessages()), 1200);

      setOpen(false);
      setShiftNameOpen(false);
      setDeptOpen(false);
      setEmpOpen(false);
      setEmpError(null);
      setEmpSelectAllDraft(false);

      setForm({
        name: "",
        department: "",
        employee_ids: [],
        start_time: "06:00",
        end_time: "14:00",
        total_hours: 8,
        is_night: false,
      });

      return () => clearTimeout(t);
    }
  }, [success, dispatch]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => (x?.name || "").toLowerCase().includes(s));
  }, [items, q]);

  const employees = useMemo(() => {
    if (!form.department) return [];
    const list = empCache?.[form.department];
    return Array.isArray(list) ? list : [];
  }, [empCache, form.department]);

  const allEmpIds = useMemo(() => {
    return employees.map(getEmpId).filter(Boolean);
  }, [employees]);

  const appliedAll =
    allEmpIds.length > 0 &&
    Array.isArray(form.employee_ids) &&
    form.employee_ids.length === allEmpIds.length;

  // Load employees when department changes (cached)
  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      if (!open) return;
      if (!form.department) return;

      if (Array.isArray(empCache?.[form.department])) return;

      setEmpLoading(true);
      setEmpError(null);

      try {
        const res = await api.get(`/api/department/${form.department}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });

        if (cancelled) return;

        const list = Array.isArray(res.data) ? res.data : [];
        setEmpCache((p) => ({ ...p, [form.department]: list }));
      } catch (e) {
        if (cancelled) return;
        setEmpError(
          e?.response?.data?.detail ||
            e?.response?.data ||
            e?.message ||
            "Failed to load employees",
        );
      } finally {
        if (!cancelled) setEmpLoading(false);
      }
    }

    loadEmployees();
    return () => {
      cancelled = true;
    };
  }, [form.department, open, empCache, token]);

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(clearShiftTypeMessages());

    if (!form.name.trim()) return alert("Shift name is required");

    const hours =
      form.total_hours !== "" && form.total_hours !== null
        ? Number(form.total_hours)
        : calcHours(form.start_time, form.end_time);

    // ✅ Keep payload ONLY for /shifts/ (don’t send department/employee_ids unless backend supports it)
    const payload = {
      name: form.name.trim(),
      start_time: hhmmToApiTime(form.start_time),
      end_time: hhmmToApiTime(form.end_time),
      total_hours: Number.isFinite(hours) ? hours : 0,
      is_night: !!form.is_night,
    };

    dispatch(addShiftType(payload));
  };

  // text for employee button
  const employeeBtnText = !form.department
    ? "Select department first"
    : appliedAll
      ? "All Employees"
      : "Select All Employees";

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 text-white">
      <div className="rounded-2xl bg-gradient-to-b from-[#0e1b34] via-[#18234b] to-[#223366] border border-white/10 shadow-xl">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-4 sm:px-5 py-4 border-b border-white/10">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-wide">
              Shift Types
            </h1>
           
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 w-full sm:w-72">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search shift..."
                className="bg-transparent outline-none text-sm w-full placeholder:text-white/40"
              />
            </div>

            <button
              onClick={() => dispatch(fetchShiftTypes())}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2
                         bg-white/10 hover:bg-white/15 border border-white/10 w-full sm:w-auto"
              type="button"
              disabled={loading}
            >
              <MdRefresh className="text-lg" />
              <span className="text-sm font-semibold">
                {loading ? "Loading..." : "Reload"}
              </span>
            </button>

            <button
              onClick={() => {
                dispatch(clearShiftTypeMessages());
                setEmpError(null);
                setOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2
                         bg-[#FF5800] hover:brightness-110 font-semibold w-full sm:w-auto"
              type="button"
            >
              <MdAdd className="text-lg" />
              Add Shift
            </button>
          </div>
        </div>

        {/* Alerts */}
        {(error || success) && (
          <div className="px-4 sm:px-5 py-3 border-b border-white/10">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-200 text-sm">
                {String(error)}
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-emerald-200 text-sm mt-2">
                {String(success)}
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="p-4 sm:p-5">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-white/5">
                <tr className="text-left text-white/80">
                  <th className="px-3 sm:px-4 py-2.5 font-semibold">Name</th>

                  <th className="px-3 sm:px-4 py-2.5 font-semibold lg:hidden">
                    Time
                  </th>

                  <th className="px-3 sm:px-4 py-2.5 font-semibold hidden lg:table-cell">
                    Start
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 font-semibold hidden lg:table-cell">
                    End
                  </th>

                  <th className="px-3 sm:px-4 py-2.5 font-semibold">Hours</th>
                  <th className="px-3 sm:px-4 py-2.5 font-semibold">Night</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 sm:px-4 py-4 text-white/70" colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-3 sm:px-4 py-6 text-white/60" colSpan={5}>
                      No shifts found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((x) => {
                    const st = shortTime(x?.start_time);
                    const et = shortTime(x?.end_time);
                    return (
                      <tr
                        key={x.id || `${x.name}-${x.start_time}`}
                        className="border-t border-white/10"
                      >
                        <td className="px-3 sm:px-4 py-2.5 font-semibold">
                          {x?.name || "-"}
                        </td>

                        <td className="px-3 sm:px-4 py-2.5 text-white/80 lg:hidden">
                          {st} → {et}
                        </td>

                        <td className="px-3 sm:px-4 py-2.5 text-white/80 hidden lg:table-cell">
                          {st}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-white/80 hidden lg:table-cell">
                          {et}
                        </td>

                        <td className="px-3 sm:px-4 py-2.5 text-white/80">
                          {x?.total_hours ?? 0}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-white/80">
                          {x?.is_night ? "Yes" : "No"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] md:pl-72"
          onMouseDown={() => {
            setShiftNameOpen(false);
            setDeptOpen(false);
            setEmpOpen(false);
          }}
        >
          <div className="h-full w-full">
            <div className="h-full w-full sm:flex sm:items-center sm:justify-center sm:p-4">
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className="h-full w-full sm:h-auto sm:max-h-[92vh] sm:w-full sm:max-w-[560px] lg:max-w-[760px]
                           rounded-none sm:rounded-2xl bg-[#0e1b34] border border-white/10 shadow-2xl
                           flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/10 bg-[#0e1b34]">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold">
                      Create Shift
                    </h2>
                  
                  </div>
                  <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/15"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <IoCloseSharp className="text-xl" />
                  </button>
                </div>

                <form onSubmit={onSubmit} className="flex-1 flex flex-col">
                  {/* Body */}
                  <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
                    {/* ✅ 3 BOX DESIGN */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      {/* 1) Shift Name dropdown + type */}
                      <div className="relative">
                        <label className="text-sm text-white/80">Shift Name</label>

                        <button
                          type="button"
                          onClick={() => {
                            setShiftNameOpen((v) => !v);
                            setDeptOpen(false);
                            setEmpOpen(false);
                          }}
                          className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-left flex items-center justify-between"
                        >
                          <span className={form.name ? "text-white" : "text-white/40"}>
                            {form.name || "Select / Type shift name"}
                          </span>
                          <span className="text-white/60">▾</span>
                        </button>

                        {shiftNameOpen && (
                          <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-[#0b1630] shadow-2xl overflow-hidden">
                            <div className="p-2 border-b border-white/10">
                              <input
                                value={form.name}
                                onChange={(e) =>
                                  setForm((p) => ({ ...p, name: e.target.value }))
                                }
                                placeholder="Type shift name..."
                                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none text-sm"
                              />
                            </div>

                            <div className="max-h-56 overflow-y-auto">
                              {(items || [])
                                .filter((x) =>
                                  (x?.name || "")
                                    .toLowerCase()
                                    .includes((form.name || "").toLowerCase()),
                                )
                                .slice(0, 30)
                                .map((x) => (
                                  <button
                                    key={x.id || x.name}
                                    type="button"
                                    onClick={() => {
                                      setForm((p) => ({ ...p, name: x?.name || "" }));
                                      setShiftNameOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm"
                                  >
                                    {x?.name || "-"}
                                  </button>
                                ))}

                              {(items || []).length === 0 && (
                                <div className="px-4 py-3 text-sm text-white/60">
                                  No shifts found. Type manually.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2) Department dropdown */}
                      <div className="relative">
                        <label className="text-sm text-white/80">Department</label>

                        <button
                          type="button"
                          onClick={() => {
                            setDeptOpen((v) => !v);
                            setShiftNameOpen(false);
                            setEmpOpen(false);
                          }}
                          className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-left flex items-center justify-between"
                        >
                          <span
                            className={form.department ? "text-white" : "text-white/40"}
                          >
                            {form.department || "Select Department"}
                          </span>
                          <span className="text-white/60">▾</span>
                        </button>

                        {deptOpen && (
                          <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-[#0b1630] shadow-2xl overflow-hidden">
                            <div className="max-h-56 overflow-y-auto">
                              {DEPARTMENTS.map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    // ✅ reset employee selection when dept changes
                                    setForm((p) => ({
                                      ...p,
                                      department: d,
                                      employee_ids: [],
                                    }));
                                    setEmpSelectAllDraft(false);
                                    setDeptOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm"
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3) Employee dropdown (ONLY Select All tick + Apply) */}
                      <div className="relative">
                        <label className="text-sm text-white/80">Employee</label>

                        <button
                          type="button"
                          disabled={!form.department}
                          onClick={() => {
                            if (!form.department) return;

                            // set draft from current applied state
                            setEmpSelectAllDraft(appliedAll);

                            setEmpOpen((v) => !v);
                            setShiftNameOpen(false);
                            setDeptOpen(false);
                          }}
                          className={`mt-2 w-full rounded-xl border border-white/10 px-4 py-3 text-left flex items-center justify-between
                            ${!form.department ? "bg-white/5 opacity-60 cursor-not-allowed" : "bg-white/5"}`}
                        >
                          <span className={appliedAll ? "text-white" : "text-white/40"}>
                            {employeeBtnText}
                          </span>
                          <span className="text-white/60">▾</span>
                        </button>

                        {empOpen && (
                          <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-[#0b1630] shadow-2xl overflow-hidden">
                            <div className="max-h-72 overflow-y-auto">
                              {empLoading ? (
                                <div className="px-4 py-3 text-sm text-white/70">
                                  Loading...
                                </div>
                              ) : empError ? (
                                <div className="px-4 py-3 text-sm text-red-200">
                                  {String(empError)}
                                </div>
                              ) : employees.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-white/70">
                                  No employees in {form.department}
                                </div>
                              ) : (
                                <>
                                  {/* ✅ ONLY ONE CHECKBOX: Select All */}
                                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                    <label className="flex items-center gap-3 text-sm text-white/80 select-none">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={empSelectAllDraft}
                                        onChange={(e) =>
                                          setEmpSelectAllDraft(e.target.checked)
                                        }
                                      />
                                      Select All Employees
                                    </label>

                                    <div className="text-xs text-white/60">
                                      {employees.length} employees
                                    </div>
                                  </div>

                                  {/* show list (read-only) */}
                                  {employees.slice(0, 250).map((e) => {
                                    const empId = getEmpId(e);
                                    const empName = e?.name || e?.full_name || "";
                                    return (
                                      <div
                                        key={empId || empName}
                                        className="px-4 py-3 border-b border-white/5"
                                      >
                                        <div className="font-semibold text-sm">
                                          {empId || "-"}
                                        </div>
                                        {empName ? (
                                          <div className="text-white/70 text-xs mt-0.5">
                                            {empName}
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}

                                  {/* Apply */}
                                  <div className="sticky bottom-0 bg-[#0b1630] border-t border-white/10 p-3">
                                    <button
                                      type="button"
                                      className="w-full rounded-xl px-4 py-2.5 bg-[#FF5800] hover:brightness-110 font-extrabold"
                                      onClick={() => {
                                        setForm((p) => ({
                                          ...p,
                                          employee_ids: empSelectAllDraft ? allEmpIds : [],
                                        }));
                                        setEmpOpen(false);
                                      }}
                                    >
                                      Apply
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-white/80">Start Time</label>
                        <input
                          type="time"
                          value={form.start_time}
                          onChange={(e) => {
                            const st = e.target.value;
                            setForm((p) => ({
                              ...p,
                              start_time: st,
                              total_hours: calcHours(st, p.end_time),
                            }));
                          }}
                          className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-white/80">End Time</label>
                        <input
                          type="time"
                          value={form.end_time}
                          onChange={(e) => {
                            const et = e.target.value;
                            setForm((p) => ({
                              ...p,
                              end_time: et,
                              total_hours: calcHours(p.start_time, et),
                            }));
                          }}
                          className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="text-sm text-white/80">Total Hours</label>
                        <input
                          type="number"
                          step="0.25"
                          min={0}
                          value={form.total_hours}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, total_hours: e.target.value }))
                          }
                          className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                        <input
                          id="nightShift"
                          type="checkbox"
                          checked={form.is_night}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, is_night: e.target.checked }))
                          }
                          className="h-4 w-4"
                        />
                        <label
                          htmlFor="nightShift"
                          className="text-sm text-white/80 select-none"
                        >
                          Night Shift
                        </label>
                      </div>
                    </div>

                    <div className="h-2" />
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 z-10 border-t border-white/10 bg-[#0e1b34] px-4 sm:px-5 py-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="w-full rounded-xl px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/10 font-semibold"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={creating}
                        className="w-full rounded-xl px-4 py-3 bg-[#FF5800] hover:brightness-110 font-extrabold disabled:opacity-60"
                      >
                        {creating ? "Saving..." : "Save Shift"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}