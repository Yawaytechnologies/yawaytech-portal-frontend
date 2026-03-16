import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MdRefresh,
  MdSave,
  MdEdit,
  MdDeleteOutline,
  MdAdd,
  MdClose,
} from "react-icons/md";
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

/* ---------------- toast ---------------- */
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

/* ---------------- helpers ---------------- */
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
    if (String(b?.rule_type || "").toUpperCase() === "DEDUCTION") {
      deduction += amt;
    } else {
      allowance += amt;
    }
  }

  return { allowance, deduction };
};

function Chip({ children, tone = "neutral" }) {
  const toneCls =
    tone === "orange"
      ? "border-orange-200 bg-orange-50 text-[#FF5800]"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "red"
          ? "border-red-200 bg-red-50 text-red-700"
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

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-xs font-extrabold text-[#0e1b34]/80">{label}</div>
        {hint ? (
          <div className="text-[11px] text-[#0e1b34]/55">{hint}</div>
        ) : null}
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

function SalaryModal({
  open,
  onClose,
  editingId,
  employeeId,
  setEmployeeId,
  baseSalary,
  setBaseSalary,
  policyId,
  setPolicyId,
  policies,
  polLoading,
  selectedPolicy,
  saving,
  onSave,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/40 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#0e1b34] to-[#1d3b8b] px-5 py-4 text-white">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70">
              Salary Management
            </div>
            <h2 className="mt-1 text-xl font-extrabold">
              {editingId ? `Edit Salary #${editingId}` : "Create Salary"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="max-h-[85vh] overflow-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Employee ID" hint="numeric employee_id">
              <input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="ex: 23"
                inputMode="numeric"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20"
              />
            </Field>

            <Field label="Base Salary" hint="base_salary">
              <input
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="ex: 25000"
                inputMode="numeric"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Payroll Policy" hint="payroll_policy_id">
                <select
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20"
                >
                  <option value="">
                    {polLoading
                      ? "Loading policies..."
                      : "Select payroll policy"}
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
              </Field>
            </div>
          </div>

          {selectedPolicy ? (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-[#f8fafc] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="dark">Policy ID: {selectedPolicy.id}</Chip>
                <Chip>{selectedPolicy.name}</Chip>
                <Chip tone={selectedPolicy.is_active ? "green" : "red"}>
                  {selectedPolicy.is_active ? "Active" : "Inactive"}
                </Chip>
              </div>

              <div className="mt-3 text-sm text-[#0e1b34]/75">
                {selectedPolicy.description || "No description"}
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs font-semibold text-[#8a3f00]">
            Salary API needs numeric{" "}
            <span className="font-extrabold">employee_id</span>, not employee
            code like YTP001.
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Btn
              type="button"
              onClick={onClose}
              className="h-11 border border-gray-200 bg-white text-[#0e1b34] hover:bg-gray-50"
            >
              Cancel
            </Btn>

            <Btn
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`h-11 min-w-[170px] text-white ${
                saving
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-[#FF5800] hover:bg-[#ff6a1a]"
              }`}
            >
              <MdSave className="text-lg" />
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Salary"
                  : "Create Salary"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSalaries() {
  const dispatch = useDispatch();

  const items = useSelector(selectSalaryItems);
  const loading = useSelector(selectSalaryLoading);
  const saving = useSelector(selectSalarySaving);
  const deleting = useSelector(selectSalaryDeleting);
  const error = useSelector(selectSalaryError);

  const policies = useSelector(selectPolicies);
  const polLoading = useSelector(selectPoliciesLoading);
  const polError = useSelector(selectPoliciesError);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [employeeId, setEmployeeId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [policyId, setPolicyId] = useState("");

  const [filterEmpId, setFilterEmpId] = useState("");
  const [filterPolicyId, setFilterPolicyId] = useState("");

  const refresh = () => {
    dispatch(fetchSalaries());
    dispatch(fetchPayrollPolicies());
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (error) {
      toast(String(error), {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
    }
  }, [error]);

  useEffect(() => {
    if (polError) {
      toast(String(polError), {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
    }
  }, [polError]);

  const policyMap = useMemo(() => {
    const m = new Map();
    for (const p of policies || []) {
      m.set(Number(p?.id), p);
    }
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
      const f = filterEmpId.trim();
      out = out.filter((r) => String(r.employee_id ?? "").includes(f));
    }

    if (filterPolicyId.trim()) {
      const n = Number(filterPolicyId);
      if (!Number.isNaN(n)) {
        out = out.filter((r) => Number(r.payroll_policy_id) === n);
      }
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

  const closeModal = () => {
    setModalOpen(false);
    clearForm();
  };

  const openCreateModal = () => {
    clearForm();
    setModalOpen(true);
  };

  const onEdit = (r) => {
    setEditingId(r.id);
    setEmployeeId(String(r.employee_id ?? ""));
    setBaseSalary(String(r.base_salary ?? ""));
    setPolicyId(String(r.payroll_policy_id ?? ""));
    setModalOpen(true);
  };

  const onSave = async () => {
    const eid = Number(employeeId);
    const bs = Number(baseSalary);
    const pid = Number(policyId);

    if (Number.isNaN(eid) || eid <= 0) {
      toast("Enter valid numeric employee_id", {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
      return;
    }

    if (Number.isNaN(bs) || bs <= 0) {
      toast("Enter valid base_salary", {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
      return;
    }

    if (Number.isNaN(pid) || pid <= 0) {
      toast("Select payroll policy", {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
      return;
    }

    if (!editingId) {
      const res = await dispatch(
        createSalaryThunk({
          payload: {
            employee_id: eid,
            base_salary: bs,
            payroll_policy_id: pid,
          },
        }),
      );

      if (createSalaryThunk.fulfilled.match(res)) {
        toast("Salary created", {
          ...TOAST_BASE,
          style: STYLE_OK,
          icon: false,
        });
        closeModal();
        dispatch(fetchSalaries());
      } else {
        toast(String(res.payload || "Create failed"), {
          ...TOAST_BASE,
          style: STYLE_ERR,
          icon: false,
        });
      }
      return;
    }

    const res = await dispatch(
      updateSalaryThunk({
        salaryId: editingId,
        payload: {
          employee_id: eid,
          base_salary: bs,
          payroll_policy_id: pid,
        },
      }),
    );

    if (updateSalaryThunk.fulfilled.match(res)) {
      toast("Salary updated", {
        ...TOAST_BASE,
        style: STYLE_OK,
        icon: false,
      });
      closeModal();
      dispatch(fetchSalaries());
    } else {
      toast(String(res.payload || "Update failed"), {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
    }
  };

  const onDelete = async (salaryId) => {
    const ok = window.confirm(`Delete salary record #${salaryId}?`);
    if (!ok) return;

    const res = await dispatch(deleteSalaryThunk({ salaryId }));

    if (deleteSalaryThunk.fulfilled.match(res)) {
      toast("Deleted", {
        ...TOAST_BASE,
        style: STYLE_OK,
        icon: false,
      });
      dispatch(fetchSalaries());
    } else {
      toast(String(res.payload || "Delete failed"), {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-[#0e1b34]">
      <div className="mx-auto w-full max-w-[98%] 2xl:max-w-[1600px] px-2 py-4 sm:px-4 lg:px-6">
        <div className="rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0e1b34]/55">
                Admin
              </div>
              <h1 className="mt-1 text-2xl font-extrabold">
                Salary Management
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <Chip tone="orange">{loading ? "Loading..." : "Ready"}</Chip>
                <Chip tone="dark">{rows.length} record(s)</Chip>
                <Chip>{(policies || []).length} policies</Chip>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Btn
                type="button"
                onClick={refresh}
                className="h-11 border border-gray-200 bg-white hover:bg-gray-50"
              >
                <MdRefresh className="text-[#FF5800]" />
                Refresh
              </Btn>

              <Btn
                type="button"
                onClick={openCreateModal}
                className="h-11 bg-[#4f46e5] text-white hover:bg-[#4338ca]"
              >
                <MdAdd className="text-lg" />
                New Salary
              </Btn>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-[#f8fafc] px-4 py-4 sm:px-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                value={filterEmpId}
                onChange={(e) => setFilterEmpId(e.target.value)}
                placeholder="Filter employee_id"
                inputMode="numeric"
                className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20"
              />

              <input
                value={filterPolicyId}
                onChange={(e) => setFilterPolicyId(e.target.value)}
                placeholder="Filter policy_id"
                inputMode="numeric"
                className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20"
              />

              <div className="flex items-center rounded-2xl border border-orange-100 bg-orange-50 px-4 text-xs font-semibold text-[#8a3f00]">
                Numeric employee_id only. Not employee code.
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="overflow-auto rounded-[24px] border border-gray-200 bg-white">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-[#f8fafc]">
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#0e1b34]/65">
                      Salary ID
                    </th>
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#0e1b34]/65">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#0e1b34]/65">
                      Policy
                    </th>
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#0e1b34]/65">
                      Base
                    </th>
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#0e1b34]/65">
                      Gross
                    </th>
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#0e1b34]/65">
                      Deductions
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold uppercase tracking-wide text-[#0e1b34]/65">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 && !loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-[#0e1b34]/70"
                      >
                        No salary records found
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const t = calcTotals(r.breakdowns);

                      return (
                        <tr
                          key={String(r.id)}
                          className="border-b border-gray-100 hover:bg-[#0e1b34]/[0.02]"
                        >
                          <td className="px-4 py-4 font-extrabold">{r.id}</td>
                          <td className="px-4 py-4">{r.employee_id}</td>
                          <td className="px-4 py-4">
                            <div className="font-semibold">
                              {policyLabel(r.payroll_policy_id)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {fmtMoney(r.base_salary)}
                          </td>
                          <td className="px-4 py-4 font-extrabold text-emerald-700">
                            {fmtMoney(r.gross_salary)}
                          </td>
                          <td className="px-4 py-4 font-extrabold text-red-600">
                            -{fmtMoney(t.deduction)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <Btn
                                type="button"
                                onClick={() => onEdit(r)}
                                className="border border-gray-200 bg-white hover:bg-gray-50"
                              >
                                <MdEdit className="text-lg text-[#FF5800]" />
                                Edit
                              </Btn>

                              <Btn
                                type="button"
                                onClick={() => onDelete(r.id)}
                                disabled={deleting}
                                className="border border-red-200 bg-white text-[#991B1B] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <MdDeleteOutline className="text-lg" />
                                Delete
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

      <SalaryModal
        open={modalOpen}
        onClose={closeModal}
        editingId={editingId}
        employeeId={employeeId}
        setEmployeeId={setEmployeeId}
        baseSalary={baseSalary}
        setBaseSalary={setBaseSalary}
        policyId={policyId}
        setPolicyId={setPolicyId}
        policies={policies}
        polLoading={polLoading}
        selectedPolicy={selectedPolicy}
        saving={saving}
        onSave={onSave}
      />
    </div>
  );
}
