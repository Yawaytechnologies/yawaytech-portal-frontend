// src/components/EmployeeOverview/Salary.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import { MdDeleteOutline, MdEdit, MdRefresh } from "react-icons/md";
import { toast, Slide } from "react-toastify";

import {
  fetchSalaries,
  deleteSalaryThunk,
} from "../../redux/actions/salaryActions";

import {
  selectSalaryItems,
  selectSalaryLoading,
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

function Chip({ children, tone = "neutral", className = "" }) {
  const toneCls =
    tone === "orange"
      ? "border-orange-200 bg-orange-50 text-[#FF5800]"
      : tone === "dark"
        ? "border-[#0e1b34]/15 bg-[#0e1b34]/[0.04] text-[#0e1b34]"
        : tone === "blue"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : tone === "amber"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : tone === "red"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-gray-200 bg-white text-[#0e1b34]";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold ${toneCls} ${className}`}
    >
      {children}
    </span>
  );
}

function Btn({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-[13px] sm:text-[15px] font-semibold transition ${className}`}
    />
  );
}

function KV({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[10px] sm:text-[11px] font-semibold text-gray-500">
        {k}
      </div>
      <div className="text-[11px] sm:text-[13px] font-bold text-[#0e1b34]">
        {v}
      </div>
    </div>
  );
}

export default function Salary({ open, onClose, employeeId, employeeCode }) {
  const dispatch = useDispatch();

  const items = useSelector(selectSalaryItems);
  const loading = useSelector(selectSalaryLoading);
  const deleting = useSelector(selectSalaryDeleting);
  const error = useSelector(selectSalaryError);

  const eid = useMemo(() => {
    const n = Number(employeeId);
    return Number.isNaN(n) ? null : n;
  }, [employeeId]);

  const [editingId, setEditingId] = useState(null);
  const [expanded, setExpanded] = useState({});

  const mode = loading
    ? "GET"
    : deleting
      ? "DELETE"
      : editingId
        ? "PUT"
        : "VIEW";

  const modeLabel =
    mode === "GET"
      ? "Fetching salary records"
      : mode === "DELETE"
        ? "Deleting salary record"
        : mode === "PUT"
          ? "Update salary"
          : "Salary records";

  const modeTone =
    mode === "GET"
      ? "blue"
      : mode === "DELETE"
        ? "red"
        : mode === "PUT"
          ? "amber"
          : "dark";

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
    setExpanded({});
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eid]);

  useEffect(() => {
    if (!open || !error) return;
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
    setExpanded((p) => ({ ...p, [r.id]: false }));
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

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] bg-[#07122b]/55 backdrop-blur-[3px]">
      <div className="flex min-h-screen items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-6xl bg-white sm:rounded-[28px] rounded-none border border-[#eef1f6] shadow-[0_24px_80px_rgba(15,23,42,0.22)] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="shrink-0 border-b border-[#eef1f6] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[20px] sm:text-[24px] lg:text-[28px] font-bold text-[#16233b] leading-tight">
                  Salary Details
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <Chip tone="dark">DB ID: {eid ?? "—"}</Chip>
                  {employeeCode ? (
                    <Chip tone="dark">Code: {employeeCode}</Chip>
                  ) : null}
                  <Chip tone="orange">
                    {loading ? "Loading..." : `${rows.length} record(s)`}
                  </Chip>
                  <Chip tone={modeTone}>{mode}</Chip>
                  <Chip>{modeLabel}</Chip>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Btn
                  type="button"
                  onClick={refresh}
                  className="h-10 sm:h-12 min-w-[44px] sm:min-w-[120px] border border-[#dde3ec] bg-white text-[#16233b] hover:bg-[#f7f9fc]"
                >
                  <MdRefresh className="text-[18px] text-[#ff5a00]" />
                  <span className="hidden sm:inline">Refresh</span>
                </Btn>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-[#667085] hover:bg-[#f4f6fa] transition"
                >
                  <IoClose className="text-[24px] sm:text-[28px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 bg-[#f7f9fc] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 overflow-hidden">
            <div className="h-full rounded-[20px] sm:rounded-[28px] border border-[#dde3ec] bg-white flex flex-col overflow-hidden">
              <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-[#eef1f6] flex items-center justify-between gap-3 shrink-0">
                <div className="text-[13px] sm:text-[15px] lg:text-[16px] font-bold text-[#16233b]">
                  Salary Records
                </div>
                <div className="text-[10px] sm:text-[12px] text-[#8a94a6] font-semibold">
                  PF/ESI breakdowns
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-3">
                {loading ? (
                  <div className="rounded-2xl border border-[#dbe7ff] bg-[#f5f9ff] px-4 py-3 text-[12px] sm:text-sm font-medium text-[#285ea8]">
                    Fetching salary records...
                  </div>
                ) : null}

                {rows.length === 0 && !loading ? (
                  <div className="rounded-2xl border border-dashed border-[#dbe2eb] bg-[#f8fafc] p-6 sm:p-10 text-center">
                    <div className="text-[14px] sm:text-[16px] font-bold text-[#16233b]">
                      No records
                    </div>
                    <div className="text-[12px] sm:text-[14px] text-[#7d8799] mt-2">
                      Create salary to see gross_salary + PF/ESI breakdowns
                      here.
                    </div>
                  </div>
                ) : (
                  rows.map((r) => {
                    const t = calcTotals(r.breakdowns);
                    const isOpen = !!expanded[r.id];

                    return (
                      <div
                        key={String(r.id)}
                        className="rounded-2xl border border-[#dde3ec] bg-white"
                      >
                        <div className="p-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <Chip tone="dark">Salary ID: {r.id}</Chip>
                              <Chip>Policy: {r.payroll_policy_id ?? "—"}</Chip>
                              <Chip>Base: {fmtMoney(r.base_salary)}</Chip>
                              <Chip tone="orange">
                                Payable: {fmtMoney(r.gross_salary)}
                              </Chip>
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                                <KV
                                  k="Allowances total"
                                  v={fmtMoney(t.allowance)}
                                />
                              </div>
                              <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                                <KV
                                  k="Deductions total"
                                  v={`-${fmtMoney(t.deduction)}`}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-row sm:flex-row lg:flex-col gap-2 lg:items-end">
                            <button
                              type="button"
                              onClick={() => onEdit(r)}
                              className="h-10 px-4 rounded-2xl border border-amber-200 bg-amber-50 text-[12px] sm:text-[13px] font-semibold text-amber-700 hover:bg-amber-100 transition"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <MdEdit className="text-[16px] sm:text-[18px]" />
                                Edit
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onDelete(r.id)}
                              disabled={deleting}
                              className="h-10 px-4 rounded-2xl border border-red-200 bg-red-50 text-[12px] sm:text-[13px] font-semibold text-[#e53935] hover:bg-[#ffeaea] transition disabled:opacity-60"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <MdDeleteOutline className="text-[16px] sm:text-[18px]" />
                                {deleting ? "Deleting..." : "Delete"}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="px-4 pb-4">
                          <button
                            type="button"
                            onClick={() => toggleExpand(r.id)}
                            className="w-full h-10 sm:h-11 rounded-2xl border border-[#dde3ec] font-semibold text-[12px] sm:text-[14px] text-[#16233b] hover:bg-[#f8fafc] transition"
                          >
                            {isOpen
                              ? "Hide breakdowns"
                              : `View breakdowns (${r.breakdowns?.length ?? 0})`}
                          </button>

                          {isOpen ? (
                            <div className="mt-3 space-y-2">
                              {r.breakdowns?.length ? (
                                r.breakdowns.map((b, idx) => {
                                  const a = amtView(b);
                                  return (
                                    <div
                                      key={String(b?.id ?? `${r.id}-${idx}`)}
                                      className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="text-[12px] sm:text-[13px] font-bold text-[#16233b]">
                                            {b?.rule_name || "Rule"}
                                          </div>
                                          <div className="text-[11px] sm:text-[12px] text-[#7d8799] mt-0.5">
                                            {b?.rule_type || "—"} • applies_to:{" "}
                                            {b?.applies_to || "—"}
                                          </div>
                                        </div>
                                        <div
                                          className={`text-[12px] sm:text-[14px] font-bold ${a.cls}`}
                                        >
                                          {a.text}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-[12px] sm:text-[14px] text-[#7d8799]">
                                  No breakdown items.
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-3 sm:px-5 border-t border-[#eef1f6] text-[10px] sm:text-[12px] text-[#8a94a6] shrink-0">
                Backend fields: employee_id, base_salary, payroll_policy_id,
                gross_salary, breakdowns[]
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 border-t border-[#eef1f6] bg-[#fffefe] shrink-0">
            <div className="flex justify-end">
              {/* <Btn
                type="button"
                onClick={onClose}
                className="h-10 sm:h-12 min-w-[96px] sm:min-w-[100px] border border-[#21314d]/15 bg-white text-[#21314d] hover:bg-[#f7f9fc]"
              >
                Close
              </Btn> */}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
