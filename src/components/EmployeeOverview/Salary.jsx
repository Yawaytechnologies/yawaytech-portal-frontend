// src/components/EmployeeOverview/Salary.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import { MdDeleteOutline, MdEdit, MdRefresh, MdSave } from "react-icons/md";
import { toast, Slide } from "react-toastify";

import {
  fetchSalaries,
  createSalaryThunk,
  updateSalaryThunk,
  deleteSalaryThunk,
} from "../../redux/actions/salaryActions";

import {
  selectSalaryItems,
  selectSalaryLoading,
  selectSalarySaving,
  selectSalaryDeleting,
  selectSalaryError,
} from "../../redux/reducer/salarySlice";

/* toast */
const TOAST_BASE = {
  position: "top-center",
  transition: Slide,
  autoClose: 1800,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
};

const PILL = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  width: "auto",
  maxWidth: "min(82vw, 360px)",
  padding: "6px 10px",
  lineHeight: 1.2,
  borderRadius: "12px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  fontSize: "0.82rem",
  fontWeight: 800,
};

const STYLE_OK = {
  ...PILL,
  background: "#ECFDF5",
  color: "#065F46",
  border: "1px solid #A7F3D0",
};

const STYLE_ERR = {
  ...PILL,
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
};

const upper = (v) => String(v || "").toUpperCase();

const fmtMoney = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
};

const calcTotals = (breakdowns = []) => {
  let allowance = 0;
  let deduction = 0;
  for (const b of breakdowns || []) {
    const amt = Number(b?.amount) || 0;
    const t = upper(b?.rule_type);
    if (t === "DEDUCTION") deduction += amt;
    else allowance += amt;
  }
  return { allowance, deduction };
};

const amtView = (b) => {
  const isDed = upper(b?.rule_type) === "DEDUCTION";
  const amt = Number(b?.amount) || 0;
  return {
    text: `${isDed ? "-" : "+"}${fmtMoney(amt)}`,
    cls: isDed ? "text-red-600" : "text-emerald-600",
  };
};

function Chip({ children, tone = "neutral" }) {
  const toneCls =
    tone === "orange"
      ? "border-orange-200 bg-orange-50 text-[#FF5800]"
      : tone === "dark"
        ? "border-[#0e1b34]/15 bg-[#0e1b34]/[0.04] text-[#0e1b34]"
        : "border-gray-200 bg-white text-[#0e1b34]";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${toneCls}`}
    >
      {children}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-bold text-gray-600 mb-1">{label}</div>
      {children}
    </div>
  );
}

function Btn({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold transition ${className}`}
    />
  );
}

function KV({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[11px] font-bold text-gray-500">{k}</div>
      <div className="text-[12px] font-extrabold text-[#0e1b34]">{v}</div>
    </div>
  );
}

export default function Salary({ open, onClose, employeeId, employeeCode }) {
  const dispatch = useDispatch();

  const items = useSelector(selectSalaryItems);
  const loading = useSelector(selectSalaryLoading);
  const saving = useSelector(selectSalarySaving);
  const deleting = useSelector(selectSalaryDeleting);
  const error = useSelector(selectSalaryError);

  const eid = useMemo(() => {
    const n = Number(employeeId);
    return Number.isNaN(n) ? null : n;
  }, [employeeId]);

  const [editingId, setEditingId] = useState(null);
  const [baseSalary, setBaseSalary] = useState("");
  const [payrollPolicyId, setPayrollPolicyId] = useState("");
  const [expanded, setExpanded] = useState({}); // { [salaryId]: boolean }

  // ✅ lock body scroll while modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const refresh = async () => {
    if (eid === null) {
      dispatch(fetchSalaries({}));
      return;
    }
    const res = await dispatch(fetchSalaries({ employee_id: eid }));
    if (fetchSalaries.rejected.match(res)) {
      dispatch(fetchSalaries({}));
    }
  };

  useEffect(() => {
    if (!open) return;

    setEditingId(null);
    setBaseSalary("");
    setPayrollPolicyId("");
    setExpanded({});

    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eid]);

  useEffect(() => {
    if (!open) return;
    if (!error) return;
    toast(String(error), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
  }, [open, error]);

  const rowsAll = useMemo(() => {
    return (items || []).map((s) => ({
      id: s?.id ?? s?.salary_id,
      employee_id: s?.employee_id,
      base_salary: s?.base_salary,
      payroll_policy_id: s?.payroll_policy_id,
      gross_salary: s?.gross_salary,
      breakdowns: Array.isArray(s?.breakdowns) ? s.breakdowns : [],
    }));
  }, [items]);

  const rows = useMemo(() => {
    if (eid === null) return [];
    return rowsAll.filter((r) => Number(r.employee_id) === eid);
  }, [rowsAll, eid]);

  const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const onEdit = (r) => {
    setEditingId(r.id);
    setBaseSalary(String(r.base_salary ?? ""));
    setPayrollPolicyId(String(r.payroll_policy_id ?? ""));
    setExpanded((p) => ({ ...p, [r.id]: false }));
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setBaseSalary("");
    setPayrollPolicyId("");
  };

  const onSave = async () => {
    if (eid === null) {
      toast("Employee DB id missing (must be number)", {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
      return;
    }
    if (!baseSalary) {
      toast("Enter base salary", { ...TOAST_BASE, style: STYLE_ERR, icon: false });
      return;
    }
    if (!payrollPolicyId) {
      toast("Enter payroll policy id", { ...TOAST_BASE, style: STYLE_ERR, icon: false });
      return;
    }

    const payloadCreate = {
      employee_id: eid,
      base_salary: Number(baseSalary),
      payroll_policy_id: Number(payrollPolicyId),
    };

    const payloadUpdate = {
      base_salary: Number(baseSalary),
      payroll_policy_id: Number(payrollPolicyId),
    };

    const res = editingId
      ? await dispatch(
          updateSalaryThunk({ salaryId: editingId, payload: payloadUpdate }),
        )
      : await dispatch(createSalaryThunk({ payload: payloadCreate }));

    const ok = editingId
      ? updateSalaryThunk.fulfilled.match(res)
      : createSalaryThunk.fulfilled.match(res);

    if (ok) {
      toast(editingId ? "Salary updated" : "Salary created", {
        ...TOAST_BASE,
        style: STYLE_OK,
        icon: false,
      });
      onCancelEdit();
      refresh();
    } else {
      toast(String(res.payload || "Failed"), {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
    }
  };

  const onDelete = async (salaryId) => {
    const res = await dispatch(deleteSalaryThunk({ salaryId }));
    if (deleteSalaryThunk.fulfilled.match(res)) {
      toast("Deleted", { ...TOAST_BASE, style: STYLE_OK, icon: false });
      refresh();
    } else {
      toast(String(res.payload || "Failed"), {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
    }
  };

  if (!open) return null;

  // ✅ PORTAL: escape sidebar stacking contexts, always on top
  return createPortal(
    <div className="fixed inset-0 z-[2147483647]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* wrapper: FULL VIEW */}
      <div className="relative z-10 h-full w-full p-2 sm:p-4 lg:p-6">
        {/* card: full-height, centered, wide on desktop */}
        <div
          className="
            w-full h-[calc(100vh-16px)]
            sm:h-[calc(100vh-32px)]
            lg:h-[calc(100vh-48px)]
            max-w-[1600px] mx-auto
            bg-white rounded-2xl shadow-2xl border border-gray-200
            overflow-hidden flex flex-col
          "
        >
          {/* header */}
          <div className="shrink-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-extrabold text-[#0e1b34]">
                Salary Details
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Chip tone="dark">DB ID: {eid ?? "—"}</Chip>
                {employeeCode ? <Chip tone="dark">Code: {employeeCode}</Chip> : null}
                <Chip tone="orange">
                  {loading ? "Loading..." : `${rows.length} record(s)`}
                </Chip>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Btn
                type="button"
                onClick={refresh}
                className="h-10 border border-gray-200 bg-white text-[#0e1b34] hover:bg-gray-50"
              >
                <MdRefresh className="text-[#FF5800]" />
                <span className="hidden sm:inline">Refresh</span>
              </Btn>

              <button
                type="button"
                onClick={onClose}
                className="h-10 w-10 grid place-items-center rounded-xl border hover:bg-gray-50 transition"
                aria-label="Close"
              >
                <IoClose className="text-xl text-[#0e1b34]" />
              </button>
            </div>
          </div>

          {/* body: ONLY this area scrolls */}
          <div className="flex-1 overflow-hidden bg-[#f7f9fc]">
            <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-6">
              {/* left: form */}
              <div className="lg:col-span-4 rounded-2xl border border-gray-200 bg-white flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="text-sm font-extrabold text-[#0e1b34]">
                    {editingId ? `Edit Salary (ID: ${editingId})` : "Create Salary"}
                  </div>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="text-xs font-extrabold text-[#991B1B] hover:underline"
                    >
                      Cancel
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-500 font-semibold">
                      base_salary + payroll_policy_id
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 overflow-auto">
                  <div className="grid grid-cols-1 gap-3">
                    <Field label="Base Salary (base_salary)">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(e.target.value)}
                        placeholder="ex: 25000"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm
text-[#0e1b34] placeholder:text-gray-400 caret-[#FF5800]
outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                      />
                    </Field>

                    <Field label="Payroll Policy ID (payroll_policy_id)">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={payrollPolicyId}
                        onChange={(e) => setPayrollPolicyId(e.target.value)}
                        placeholder="ex: 2"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm
text-[#0e1b34] placeholder:text-gray-400 caret-[#FF5800]
outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Btn
                      type="button"
                      onClick={onSave}
                      disabled={saving}
                      className={`h-11 w-full px-6 text-white ${
                        saving
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-[#FF5800] hover:bg-[#ff6a1a]"
                      }`}
                    >
                      <MdSave className="text-lg" />
                      {saving ? "Saving..." : editingId ? "Update" : "Create"}
                    </Btn>
                  </div>

                  <div className="mt-3 text-[11px] text-gray-500">
                    Backend returns <b>gross_salary</b> + <b>breakdowns[]</b> (PF/ESI etc).
                  </div>
                </div>
              </div>

              {/* right: records */}
              <div className="lg:col-span-8 rounded-2xl border border-gray-200 bg-white flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="text-sm font-extrabold text-[#0e1b34]">Salary Records</div>
                  <div className="text-[11px] text-gray-500 font-semibold">PF/ESI breakdowns</div>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {rows.length === 0 && !loading ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f8fafc] p-8 text-center">
                      <div className="text-sm font-extrabold text-[#0e1b34]">No records</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Create salary to see gross_salary + PF/ESI breakdowns here.
                      </div>
                    </div>
                  ) : (
                    rows.map((r) => {
                      const t = calcTotals(r.breakdowns);
                      const isOpen = !!expanded[r.id];

                      return (
                        <div key={String(r.id)} className="rounded-2xl border border-gray-200 bg-white">
                          <div className="p-4 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Chip tone="dark">Salary ID: {r.id}</Chip>
                                <Chip>Policy: {r.payroll_policy_id ?? "—"}</Chip>
                                <Chip>Base: {fmtMoney(r.base_salary)}</Chip>
                                <Chip tone="orange">Payable: {fmtMoney(r.gross_salary)}</Chip>
                              </div>

                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="rounded-xl border border-gray-200 bg-[#f8fafc] p-3">
                                  <KV k="Allowances total" v={fmtMoney(t.allowance)} />
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-[#f8fafc] p-3">
                                  <KV k="Deductions total" v={`-${fmtMoney(t.deduction)}`} />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 xl:flex-col xl:items-end">
                              <button
                                type="button"
                                onClick={() => onEdit(r)}
                                className="h-10 px-4 rounded-xl border text-xs font-extrabold hover:bg-gray-50"
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  <MdEdit className="text-[#FF5800] text-lg" /> Edit
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onDelete(r.id)}
                                disabled={deleting}
                                className="h-10 px-4 rounded-xl border text-xs font-extrabold text-[#991B1B] hover:bg-red-50"
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  <MdDeleteOutline className="text-lg" /> Delete
                                </span>
                              </button>
                            </div>
                          </div>

                          <div className="px-4 pb-4">
                            <button
                              type="button"
                              onClick={() => toggleExpand(r.id)}
                              className="w-full h-11 rounded-xl border font-extrabold text-sm hover:bg-gray-50"
                            >
                              {isOpen
                                ? "Hide breakdowns"
                                : `View breakdowns (${r.breakdowns?.length ?? 0})`}
                            </button>

                            {isOpen ? (
                              <div className="mt-3 space-y-2">
                                {r.breakdowns?.length ? (
                                  r.breakdowns.map((b) => {
                                    const a = amtView(b);
                                    return (
                                      <div
                                        key={String(b?.id ?? Math.random())}
                                        className="rounded-xl border border-gray-200 bg-[#f8fafc] p-3"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="text-xs font-extrabold text-[#0e1b34]">
                                              {b?.rule_name || "Rule"}
                                            </div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">
                                              {b?.rule_type || "—"} • applies_to: {b?.applies_to || "—"}
                                            </div>
                                          </div>
                                          <div className={`text-sm font-extrabold ${a.cls}`}>{a.text}</div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-sm text-gray-500">No breakdown items.</div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-4 py-3 border-t text-[11px] text-gray-500">
                  Backend fields: employee_id, base_salary, payroll_policy_id, gross_salary, breakdowns[]
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="shrink-0 bg-white border-t px-4 sm:px-6 py-3 flex items-center justify-end">
            <Btn
              type="button"
              onClick={onClose}
              className="h-10 border border-gray-200 bg-white text-[#0e1b34] hover:bg-gray-50"
            >
              Close
            </Btn>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}