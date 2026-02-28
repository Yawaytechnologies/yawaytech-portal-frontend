// src/pages/AdminSalaries.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdRefresh, MdSave, MdEdit, MdDeleteOutline } from "react-icons/md";
import { toast, Slide } from "react-toastify";

import {
  fetchSalaries,
  createSalaryThunk,
  updateSalaryThunk,
  deleteSalaryThunk,
} from "../redux/actions/salaryActions";

import {
  selectSalaryItems,
  selectSalaryLoading,
  selectSalarySaving,
  selectSalaryDeleting,
  selectSalaryError,
} from "../redux/reducer/salarySlice";

import { fetchPayrollPolicies } from "../redux/actions/payrollPolicyActions";
import {
  selectPolicies,
  selectPoliciesLoading,
  selectPoliciesError,
} from "../redux/reducer/payrollPolicySlice";

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
const STYLE_OK = { ...PILL, background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" };
const STYLE_ERR = { ...PILL, background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" };

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
    if (upper(b?.rule_type) === "DEDUCTION") deduction += amt;
    else allowance += amt;
  }
  return { allowance, deduction };
};

function Chip({ children, tone = "neutral" }) {
  const toneCls =
    tone === "orange"
      ? "border-orange-200 bg-orange-50 text-[#FF5800]"
      : tone === "dark"
        ? "border-[#0e1b34]/15 bg-[#0e1b34]/[0.04] text-[#0e1b34]"
        : "border-gray-200 bg-white text-[#0e1b34]";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${toneCls}`}>
      {children}
    </span>
  );
}
function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-xs font-extrabold text-[#0e1b34]/80">{label}</div>
        {hint ? <div className="text-[11px] text-[#0e1b34]/55">{hint}</div> : null}
      </div>
      <div className="mt-1">{children}</div>
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

export default function AdminSalaries() {
  const dispatch = useDispatch();

  // salaries
  const items = useSelector(selectSalaryItems);
  const loading = useSelector(selectSalaryLoading);
  const saving = useSelector(selectSalarySaving);
  const deleting = useSelector(selectSalaryDeleting);
  const error = useSelector(selectSalaryError);

  // policies
  const policies = useSelector(selectPolicies);
  const polLoading = useSelector(selectPoliciesLoading);
  const polError = useSelector(selectPoliciesError);

  const [editingId, setEditingId] = useState(null);

  // form fields
  const [employeeId, setEmployeeId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [policyId, setPolicyId] = useState("");

  // filters
  const [filterEmpId, setFilterEmpId] = useState("");
  const [filterPolicyId, setFilterPolicyId] = useState("");

  const refresh = () => {
    dispatch(fetchSalaries({}));          // ✅ IMPORTANT
    dispatch(fetchPayrollPolicies());
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) toast(String(error), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
  }, [error]);

  useEffect(() => {
    if (polError) toast(String(polError), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
  }, [polError]);

  const policyMap = useMemo(() => {
    const m = new Map();
    for (const p of policies || []) m.set(Number(p?.id), p);
    return m;
  }, [policies]);

  const policyLabel = (pid) => {
    const p = policyMap.get(Number(pid));
    if (!p) return String(pid ?? "—");
    return `${p.id} — ${p.name}`;
  };

  const selectedPolicy = useMemo(() => {
    const pid = Number(policyId);
    if (Number.isNaN(pid)) return null;
    return policyMap.get(pid) || null;
  }, [policyId, policyMap]);

  const rows = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];

    let out = arr.map((s) => ({
      id: s?.id ?? s?.salary_id,
      employee_id: s?.employee_id,
      base_salary: s?.base_salary,
      payroll_policy_id: s?.payroll_policy_id,
      gross_salary: s?.gross_salary,
      breakdowns: Array.isArray(s?.breakdowns) ? s.breakdowns : [],
    }));

    if (filterEmpId.trim()) {
      const n = Number(filterEmpId);
      if (!Number.isNaN(n)) out = out.filter((r) => Number(r.employee_id) === n);
    }
    if (filterPolicyId.trim()) {
      const n = Number(filterPolicyId);
      if (!Number.isNaN(n)) out = out.filter((r) => Number(r.payroll_policy_id) === n);
    }

    out.sort((a, b) => Number(b.id) - Number(a.id));
    return out;
  }, [items, filterEmpId, filterPolicyId]);

  const clearForm = () => {
    setEditingId(null);
    setEmployeeId("");
    setBaseSalary("");
    setPolicyId("");
  };

  const onEdit = (r) => {
    setEditingId(r.id);
    setEmployeeId(String(r.employee_id ?? ""));
    setBaseSalary(String(r.base_salary ?? ""));
    setPolicyId(String(r.payroll_policy_id ?? ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSave = async () => {
    const eid = Number(employeeId);
    const bs = Number(baseSalary);
    const pid = Number(policyId);

    if (Number.isNaN(eid) || eid <= 0) {
      toast("Enter valid employee_id (number)", { ...TOAST_BASE, style: STYLE_ERR, icon: false });
      return;
    }
    if (Number.isNaN(bs) || bs <= 0) {
      toast("Enter valid base_salary", { ...TOAST_BASE, style: STYLE_ERR, icon: false });
      return;
    }
    if (Number.isNaN(pid) || pid <= 0) {
      toast("Select payroll policy", { ...TOAST_BASE, style: STYLE_ERR, icon: false });
      return;
    }

    // POST
    if (!editingId) {
      const res = await dispatch(
        createSalaryThunk({ payload: { employee_id: eid, base_salary: bs, payroll_policy_id: pid } }),
      );
      if (createSalaryThunk.fulfilled.match(res)) {
        toast("Salary created", { ...TOAST_BASE, style: STYLE_OK, icon: false });
        clearForm();
        dispatch(fetchSalaries({}));  // ✅ IMPORTANT
      } else {
        toast(String(res.payload || "Create failed"), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
      }
      return;
    }

    // PUT
    const res = await dispatch(
      updateSalaryThunk({ salaryId: editingId, payload: { base_salary: bs, payroll_policy_id: pid } }),
    );
    if (updateSalaryThunk.fulfilled.match(res)) {
      toast("Salary updated", { ...TOAST_BASE, style: STYLE_OK, icon: false });
      clearForm();
      dispatch(fetchSalaries({})); // ✅ IMPORTANT
    } else {
      toast(String(res.payload || "Update failed"), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
    }
  };

  const onDelete = async (salaryId) => {
    const res = await dispatch(deleteSalaryThunk({ salaryId }));
    if (deleteSalaryThunk.fulfilled.match(res)) {
      toast("Deleted", { ...TOAST_BASE, style: STYLE_OK, icon: false });
      dispatch(fetchSalaries({})); // ✅ IMPORTANT (safe)
    } else {
      toast(String(res.payload || "Delete failed"), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-[#0e1b34]">
      <div className="mx-auto w-full max-w-[98%] 2xl:max-w-[1600px] px-2 sm:px-4 lg:px-6 py-4">
        {/* header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold text-[#0e1b34]/60">ADMIN</div>
            <h1 className="text-xl sm:text-2xl font-extrabold">Salaries</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip tone="orange">{loading ? "Loading..." : "Ready"}</Chip>
              <Chip tone="dark">{rows.length} record(s)</Chip>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Btn type="button" onClick={refresh} className="border border-gray-200 bg-white hover:bg-gray-50">
              <MdRefresh className="text-[#FF5800]" /> Refresh
            </Btn>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* form */}
          <div className="xl:col-span-4 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="text-sm font-extrabold">
                {editingId ? `Edit Salary (ID: ${editingId})` : "Create Salary"}
              </div>
              {editingId ? (
                <button
                  type="button"
                  onClick={clearForm}
                  className="text-xs font-extrabold text-[#991B1B] hover:underline"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <div className="p-4 space-y-3">
              <Field label="Employee DB ID" hint="employee_id">
                <input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="ex: 61"
                  inputMode="numeric"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm
                  placeholder:text-[#0e1b34]/40 outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                />
              </Field>

              <Field label="Base Salary" hint="base_salary">
                <input
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder="ex: 25000"
                  inputMode="numeric"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm
                  placeholder:text-[#0e1b34]/40 outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                />
              </Field>

              <Field label="Payroll Policy" hint="payroll_policy_id">
                <select
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none
                  focus:ring-2 focus:ring-[#FF5800]/25"
                >
                  <option value="">
                    {polLoading ? "Loading policies..." : "Select payroll policy"}
                  </option>
                  {(policies || [])
                    .slice()
                    .sort((a, b) => Number(a.id) - Number(b.id))
                    .map((p) => (
                      <option key={String(p.id)} value={String(p.id)}>
                        {p.id} — {p.name}
                      </option>
                    ))}
                </select>

                {selectedPolicy ? (
                  <div className="mt-2 rounded-xl border border-gray-200 bg-[#f8fafc] p-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <Chip tone="dark">ID: {selectedPolicy.id}</Chip>
                      <Chip>{selectedPolicy.name}</Chip>
                      <Chip tone={selectedPolicy.is_active ? "orange" : "neutral"}>
                        {selectedPolicy.is_active ? "Active" : "Inactive"}
                      </Chip>
                    </div>
                    <div className="mt-2 text-[11px] text-[#0e1b34]/70">
                      {selectedPolicy.description || "—"}
                    </div>
                  </div>
                ) : null}
              </Field>

              <Btn
                type="button"
                onClick={onSave}
                disabled={saving}
                className={`h-11 w-full text-white ${
                  saving ? "bg-gray-300 cursor-not-allowed" : "bg-[#FF5800] hover:bg-[#ff6a1a]"
                }`}
              >
                <MdSave className="text-lg" />
                {saving ? "Saving..." : editingId ? "Update (PUT)" : "Create (POST)"}
              </Btn>

              <div className="text-[11px] text-[#0e1b34]/60">
                Note: Use policy dropdown (prevents invalid policy → backend 500).
              </div>
            </div>
          </div>

          {/* list */}
          <div className="xl:col-span-8 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm font-extrabold">Salary Records (GET)</div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={filterEmpId}
                  onChange={(e) => setFilterEmpId(e.target.value)}
                  placeholder="Filter employee_id"
                  inputMode="numeric"
                  className="h-10 w-[180px] rounded-xl border border-gray-200 bg-white px-3 text-sm
                  placeholder:text-[#0e1b34]/40 outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                />
                <input
                  value={filterPolicyId}
                  onChange={(e) => setFilterPolicyId(e.target.value)}
                  placeholder="Filter policy_id"
                  inputMode="numeric"
                  className="h-10 w-[160px] rounded-xl border border-gray-200 bg-white px-3 text-sm
                  placeholder:text-[#0e1b34]/40 outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                />
              </div>
            </div>

            <div className="p-4 bg-[#f8fafc] max-h-[72vh] overflow-auto">
              <table className="w-full min-w-[980px] text-sm bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <thead className="bg-white border-b">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-extrabold text-[#0e1b34]/70">Salary ID</th>
                    <th className="px-4 py-3 text-xs font-extrabold text-[#0e1b34]/70">Employee</th>
                    <th className="px-4 py-3 text-xs font-extrabold text-[#0e1b34]/70">Policy</th>
                    <th className="px-4 py-3 text-xs font-extrabold text-[#0e1b34]/70">Base</th>
                    <th className="px-4 py-3 text-xs font-extrabold text-[#0e1b34]/70">Payable</th>
                    <th className="px-4 py-3 text-xs font-extrabold text-[#0e1b34]/70">Deductions</th>
                    <th className="px-4 py-3 text-xs font-extrabold text-[#0e1b34]/70 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-[#0e1b34]/70">
                        No records
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const t = calcTotals(r.breakdowns);
                      return (
                        <tr key={String(r.id)} className="border-b hover:bg-[#0e1b34]/[0.02]">
                          <td className="px-4 py-3 font-extrabold">{r.id}</td>
                          <td className="px-4 py-3">{r.employee_id}</td>
                          <td className="px-4 py-3">{policyLabel(r.payroll_policy_id)}</td>
                          <td className="px-4 py-3">{fmtMoney(r.base_salary)}</td>
                          <td className="px-4 py-3 font-extrabold">{fmtMoney(r.gross_salary)}</td>
                          <td className="px-4 py-3 font-extrabold text-red-600">
                            -{fmtMoney(t.deduction)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Btn
                                type="button"
                                onClick={() => onEdit(r)}
                                className="border border-gray-200 bg-white hover:bg-gray-50"
                              >
                                <MdEdit className="text-[#FF5800] text-lg" /> Edit
                              </Btn>
                              <Btn
                                type="button"
                                onClick={() => onDelete(r.id)}
                                disabled={deleting}
                                className="border border-red-200 bg-white text-[#991B1B] hover:bg-red-50"
                              >
                                <MdDeleteOutline className="text-lg" /> Delete
                              </Btn>
                            </div>
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
      </div>
    </div>
  );
}