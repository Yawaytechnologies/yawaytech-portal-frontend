import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
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
import axios from "axios";

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

// ─── Axios instance ───────────────────────────────────────────────────────────
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:8000";

const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});
http.interceptors.request.use((config) => {
  const t =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("ytp_token") ||
    "";
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// ─── Toast config ─────────────────────────────────────────────────────────────
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
const STYLE_OK  = { ...PILL, background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" };
const STYLE_ERR = { ...PILL, background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtMoney = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
};

const calcTotals = (breakdowns = []) => {
  let allowance = 0, deduction = 0;
  for (const b of breakdowns || []) {
    const amt = Number(b?.amount) || 0;
    if (String(b?.rule_type || "").toUpperCase() === "DEDUCTION") deduction += amt;
    else allowance += amt;
  }
  return { allowance, deduction };
};

// Dropdown label: "61 — Sowjanya S — YTPL503IT"
const empDropdownLabel = (emp) =>
  emp.name && emp.employee_id
    ? `${emp.name} — ${emp.employee_id}`
    : emp.name || emp.employee_id || `ID:${emp.id}`;

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function Chip({ children, tone = "neutral" }) {
  const toneCls =
    tone === "orange" ? "border-orange-200 bg-orange-50 text-[#FF5800]"
    : tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : tone === "red"   ? "border-red-200 bg-red-50 text-red-700"
    : tone === "dark"  ? "border-[#0e1b34]/15 bg-[#0e1b34]/[0.04] text-[#0e1b34]"
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
        <div className="text-sm font-extrabold text-[#0e1b34] sm:text-base 2xl:text-lg">{label}</div>
        {hint ? <div className="text-xs sm:text-sm 2xl:text-base">{hint}</div> : null}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Btn({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition sm:gap-2 sm:px-4 sm:py-2 sm:text-sm 2xl:px-5 2xl:text-base ${className}`}
    />
  );
}

// Normal input class
const inputCls =
  "h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-12 sm:px-4 2xl:h-13 2xl:text-base disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50";

// Red error input class — used when employee already registered
const inputErrCls =
  "h-10 w-full appearance-none rounded-xl border border-red-400 bg-red-50 px-3 text-sm text-[#0e1b34] outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 sm:h-12 sm:px-4 2xl:h-13 2xl:text-base disabled:cursor-not-allowed disabled:opacity-50";

// ─── Salary Modal ─────────────────────────────────────────────────────────────
function SalaryModal({
  open, onClose, editingId,
  departments, deptLoading, selectedDept, setSelectedDept,
  employees, setEmployees, empLoading, employeeId, setEmployeeId,
  baseSalary, setBaseSalary,
  policyId, setPolicyId, policies, polLoading, selectedPolicy,
  saving, onSave,
  rows, // needed to detect duplicate inside modal
}) {
  if (!open) return null;

  // Show red state when selected employee already has a salary (create mode only)
  const alreadyRegistered =
    !editingId &&
    !!employeeId &&
    (rows || []).some((r) => Number(r.employee_id) === Number(employeeId));

  return (
    // z-index set to max possible value so modal always appears on top
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div
        className="flex w-full max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-2xl border border-white/40 bg-white shadow-2xl sm:max-w-[580px] sm:rounded-[28px] md:max-w-[680px] xl:max-w-[780px] 2xl:max-w-[880px]"
        style={{ maxHeight: "calc(100dvh - 32px)", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#0e1b34] to-[#1d3b8b] px-3 py-3 text-white sm:px-5 sm:py-4 xl:px-7 2xl:px-8">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/90 sm:text-sm 2xl:text-base">
              Salary Management
            </div>
            <h2 className="mt-0.5 text-base font-extrabold sm:mt-1 sm:text-xl 2xl:text-2xl">
              {editingId ? `Edit Salary #${editingId}` : "Create Salary"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:h-10 sm:w-10"
          >
            <MdClose className="text-base sm:text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 xl:p-6 2xl:p-8">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 2xl:gap-5">

            {/* Department */}
            <Field label="Department">
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setEmployeeId("");
                  setEmployees([]);
                }}
                className={inputCls}
              >
                <option value="">
                  {deptLoading ? "Loading departments..." : "Select department"}
                </option>
                {(departments || []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>

            {/* Employee — turns red if already has a salary record */}
            <Field
              label="Employee"
              hint={
                alreadyRegistered
                  ? <span className="font-bold text-red-500">Already has a salary record</span>
                  : null
              }
            >
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={!selectedDept || empLoading}
                className={alreadyRegistered ? inputErrCls : inputCls}
              >
                <option value="">
                  {!selectedDept
                    ? "Select department first"
                    : empLoading
                      ? "Loading employees..."
                      : "Select employee"}
                </option>
                {(employees || []).map((emp) => (
                  <option key={emp.id} value={String(emp.id)}>
                    {empDropdownLabel(emp)}
                  </option>
                ))}
              </select>
            </Field>

            {/* Base Salary */}
            <Field label="Base Salary">
              <input
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="ex: 25000"
                inputMode="numeric"
                className={inputCls}
              />
            </Field>

            {/* Payroll Policy */}
            <Field label="Payroll Policy">
              <select
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                className={inputCls}
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
            </Field>
          </div>

          {/* Policy preview */}
          {selectedPolicy ? (
            <div className="mt-3 rounded-2xl border border-gray-200 bg-[#f8fafc] p-3 sm:mt-4 sm:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="dark">Policy ID: {selectedPolicy.id}</Chip>
                <Chip>{selectedPolicy.name}</Chip>
                <Chip tone={selectedPolicy.is_active ? "green" : "red"}>
                  {selectedPolicy.is_active ? "Active" : "Inactive"}
                </Chip>
              </div>
              <div className="mt-2 text-xs text-[#0e1b34]/75 sm:text-sm">
                {selectedPolicy.description || "No description"}
              </div>
            </div>
          ) : null}

          {/* Save button — disabled when already registered */}
          <div className="mt-4 flex flex-col-reverse gap-2.5 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
            <Btn
              type="button"
              onClick={onSave}
              disabled={saving || alreadyRegistered}
              className={`h-10 w-full text-white sm:h-11 sm:w-auto sm:min-w-[150px] ${
                saving || alreadyRegistered
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-[#FF5800] hover:bg-[#ff6a1a]"
              }`}
            >
              <MdSave className="text-base sm:text-lg" />
              {saving ? "Saving..." : editingId ? "Update Salary" : "Create Salary"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSalaries() {
  const dispatch = useDispatch();

  const items      = useSelector(selectSalaryItems);
  const loading    = useSelector(selectSalaryLoading);
  const saving     = useSelector(selectSalarySaving);
  const deleting   = useSelector(selectSalaryDeleting);
  const error      = useSelector(selectSalaryError);
  const policies   = useSelector(selectPolicies);
  const polLoading = useSelector(selectPoliciesLoading);
  const polError   = useSelector(selectPoliciesError);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Department + Employee (local axios)
  const [departments,  setDepartments]  = useState([]);
  const [deptLoading,  setDeptLoading]  = useState(false);
  const [selectedDept, setSelectedDept] = useState("");
  const [employees,    setEmployees]    = useState([]);
  const [empLoading,   setEmpLoading]   = useState(false);

  // Global employee cache: numeric id → employee object (for table display)
  const [allEmployees, setAllEmployees] = useState([]);

  // Full dept->employees map for reverse-lookup on edit
  const [deptMap, setDeptMap] = useState({});

  // Form fields
  const [employeeId, setEmployeeId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [policyId,   setPolicyId]   = useState("");

  // Filters
  const [filterEmpId,    setFilterEmpId]    = useState("");
  const [filterPolicyId, setFilterPolicyId] = useState("");

  // ── Fetch all departments ─────────────────────────────────────────────────
  const fetchDepartments = useCallback(async () => {
    setDeptLoading(true);
    try {
      const res = await http.get("/api/department/employees/all");
      const data = res.data || {};
      setDepartments(Object.keys(data));
      setDeptMap(data);
      // Seed global employee cache from all depts at once
      setAllEmployees((prev) => {
        const map = new Map(prev.map((e) => [e.id, e]));
        Object.values(data).flat().forEach((e) => map.set(e.id, e));
        return Array.from(map.values());
      });
    } catch {
      setDepartments([]);
    } finally {
      setDeptLoading(false);
    }
  }, []);

  // ── Fetch employees when dept changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedDept) { setEmployees([]); setEmployeeId(""); return; }
   
    setEmpLoading(true);
    http.get(`/api/department/${selectedDept}`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setEmployees(list);
        setAllEmployees((prev) => {
          const map = new Map(prev.map((e) => [e.id, e]));
          list.forEach((e) => map.set(e.id, e));
          return Array.from(map.values());
        });
      })
      .catch(() => setEmployees([]))
      .finally(() => setEmpLoading(false));
  }, [selectedDept]);

  // ── Initial load ──────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    dispatch(fetchSalaries());
    dispatch(fetchPayrollPolicies());
    fetchDepartments();
  }, [dispatch, fetchDepartments]);

  useEffect(() => { refresh(); }, []); // eslint-disable-line

  // ── Error toasts ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (error) toast(String(error), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
  }, [error]);
  useEffect(() => {
    if (polError) toast(String(polError), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
  }, [polError]);

  // ── Policy map ────────────────────────────────────────────────────────────
  const policyMap = useMemo(() => {
    const m = new Map();
    for (const p of policies || []) m.set(Number(p?.id), p);
    return m;
  }, [policies]);

  const policyLabel = (pid) => {
    const p = policyMap.get(Number(pid));
    return p ? `${p.id} — ${p.name}` : String(pid ?? "—");
  };

  const selectedPolicy = useMemo(() => {
    const pid = Number(policyId);
    return Number.isNaN(pid) ? null : policyMap.get(pid) || null;
  }, [policyId, policyMap]);

  // ── Employee ID code lookup ───────────────────────────────────────────────
  const empById = useMemo(() => {
    const m = new Map();
    allEmployees.forEach((e) => m.set(Number(e.id), e));
    return m;
  }, [allEmployees]);

  const empCode = useCallback(
    (numericId) => {
      const emp = empById.get(Number(numericId));
      return emp?.employee_id || String(numericId ?? "—");
    },
    [empById]
  );

  // ── Table rows ────────────────────────────────────────────────────────────
  const rows = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    let out = arr.map((s) => ({
      id:                s?.id ?? s?.salary_id,
      employee_id:       s?.employee_id,
      base_salary:       s?.base_salary,
      payroll_policy_id: s?.payroll_policy_id,
      gross_salary:      s?.gross_salary,
      breakdowns:        Array.isArray(s?.breakdowns) ? s.breakdowns : [],
    }));
    if (filterEmpId.trim()) {
      const f = filterEmpId.trim().toLowerCase();
      out = out.filter(
        (r) =>
          String(r.employee_id ?? "").includes(f) ||
          empCode(r.employee_id).toLowerCase().includes(f)
      );
    }
    if (filterPolicyId.trim()) {
      const n = Number(filterPolicyId);
      if (!Number.isNaN(n)) out = out.filter((r) => Number(r.payroll_policy_id) === n);
    }
    out.sort((a, b) => Number(b.id) - Number(a.id));
    return out;
  }, [items, filterEmpId, filterPolicyId, empCode]);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const clearForm = () => {
    setEditingId(null);
    setEmployeeId("");
    setBaseSalary("");
    setPolicyId("");
    setSelectedDept("");
    setEmployees([]);
  };

  const closeModal      = () => { setModalOpen(false); clearForm(); };
  const openCreateModal = () => { clearForm(); setModalOpen(true); };

  const onEdit = (r) => {
    setEditingId(r.id);
    setBaseSalary(String(r.base_salary ?? ""));
    setPolicyId(String(r.payroll_policy_id ?? ""));

    const numericEmpId = Number(r.employee_id);
    let foundDept = "";
    let foundEmployees = [];

    for (const [dept, emps] of Object.entries(deptMap)) {
      if ((emps || []).some((e) => Number(e.id) === numericEmpId)) {
        foundDept = dept;
        foundEmployees = emps;
        break;
      }
    }

    setSelectedDept(foundDept);
    setEmployees(foundEmployees);
    setEmployeeId(String(r.employee_id ?? ""));
    setModalOpen(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const onSave = async () => {
    const eid = Number(employeeId),
          bs  = Number(baseSalary),
          pid = Number(policyId);

    if (Number.isNaN(eid) || eid <= 0) {
      toast("Select an employee", { ...TOAST_BASE, style: STYLE_ERR, icon: false }); return;
    }
    if (Number.isNaN(bs) || bs <= 0) {
      toast("Enter valid base salary", { ...TOAST_BASE, style: STYLE_ERR, icon: false }); return;
    }
    if (Number.isNaN(pid) || pid <= 0) {
      toast("Select payroll policy", { ...TOAST_BASE, style: STYLE_ERR, icon: false }); return;
    }

    if (!editingId) {
      const alreadyExists = rows.some((r) => Number(r.employee_id) === eid);
      if (alreadyExists) {
        const existingEmpCode = empCode(eid);
        toast(`${existingEmpCode} already has a salary record`, { ...TOAST_BASE, style: STYLE_ERR, icon: false });
        return;
      }
      const res = await dispatch(
        createSalaryThunk({ payload: { employee_id: eid, base_salary: bs, payroll_policy_id: pid } })
      );
      if (createSalaryThunk.fulfilled.match(res)) {
        toast("Salary created", { ...TOAST_BASE, style: STYLE_OK, icon: false });
        closeModal();
        dispatch(fetchSalaries());
      } else {
        toast(String(res.payload || "Create failed"), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
      }
      return;
    }

    // Update — employee_id stripped inside thunk
    const res = await dispatch(
      updateSalaryThunk({ salaryId: editingId, payload: { employee_id: eid, base_salary: bs, payroll_policy_id: pid } })
    );
    if (updateSalaryThunk.fulfilled.match(res)) {
      toast("Salary updated", { ...TOAST_BASE, style: STYLE_OK, icon: false });
      closeModal();
      dispatch(fetchSalaries());
    } else {
      toast(String(res.payload || "Update failed"), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const onDelete = async (salaryId) => {
    if (!window.confirm(`Delete salary record #${salaryId}?`)) return;
    const res = await dispatch(deleteSalaryThunk({ salaryId }));
    if (deleteSalaryThunk.fulfilled.match(res)) {
      toast("Deleted", { ...TOAST_BASE, style: STYLE_OK, icon: false });
      dispatch(fetchSalaries());
    } else {
      toast(String(res.payload || "Delete failed"), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0e1b34]">
      <div className="mx-auto w-full max-w-[98%] px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 2xl:max-w-[1600px] 2xl:px-8 2xl:py-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:rounded-[28px]">

          {/* ── Header ── */}
          <div className="flex flex-col gap-3 border-b border-gray-200 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between xl:px-6 2xl:px-8 2xl:py-5">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0e1b34]/55 sm:text-[11px] 2xl:text-xs">
                Admin
              </div>
              <h1 className="mt-0.5 text-xl font-extrabold sm:mt-1 sm:text-2xl xl:text-3xl 2xl:text-4xl">
                Salary Management
              </h1>
              <div className="mt-1.5 flex flex-wrap gap-2 sm:mt-2">
                <Chip tone="orange">{loading ? "Loading..." : "Ready"}</Chip>
                <Chip tone="dark">{rows.length} record(s)</Chip>
                <Chip>{(policies || []).length} policies</Chip>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn type="button" onClick={refresh} className="h-9 border border-gray-200 bg-white hover:bg-gray-50 sm:h-11">
                <MdRefresh className="text-[#FF5800]" />
              </Btn>
              <Btn type="button" onClick={openCreateModal} className="h-9 bg-[#4f46e5] text-white hover:bg-[#4338ca] sm:h-11">
                <MdAdd className="text-base sm:text-lg" /> New Salary
              </Btn>
            </div>
          </div>

          {/* ── Filter bar ── */}
          <div className="border-b border-gray-200 bg-[#f8fafc] px-3 py-3 sm:px-5 sm:py-4 xl:px-6 2xl:px-8">
            <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-3">
              <input
                value={filterEmpId}
                onChange={(e) => setFilterEmpId(e.target.value)}
                placeholder="Filter by employee ID or YTPL code"
                className="h-9 rounded-2xl border border-gray-200 bg-white px-3 text-sm placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-11 sm:px-4"
              />
              <input
                value={filterPolicyId}
                onChange={(e) => setFilterPolicyId(e.target.value)}
                placeholder="Filter by policy ID"
                inputMode="numeric"
                className="h-9 rounded-2xl border border-gray-200 bg-white px-3 text-sm placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-11 sm:px-4"
              />
            </div>
          </div>

          {/* ── Table ── */}
          <div className="p-3 sm:p-4 xl:p-5 2xl:p-6">
            <div className="overflow-auto rounded-2xl border border-gray-200 bg-white sm:rounded-[24px]">
              <table className="min-w-[720px] w-full text-sm 2xl:text-base">
                <thead className="bg-[#f8fafc]">
                  <tr className="border-b border-gray-200 text-left">
                    {[ "Employee ID", "Policy", "Base", "Gross", "Deduction", "Actions"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-[#0e1b34]/65 sm:px-4 sm:py-3 2xl:px-5 2xl:text-sm${i === 6 ? " text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#0e1b34]/70">
                        No salary records found
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const t = calcTotals(r.breakdowns);
                      return (
                        <tr key={String(r.id)} className="border-b border-gray-100 hover:bg-[#0e1b34]/[0.02]">

                       

                          {/* Employee ID — YTPL code only */}
                          <td className="px-3 py-3 sm:px-4 sm:py-4 2xl:px-5">
                            <div className="font-extrabold text-[#0e1b34]">
                              {empCode(r.employee_id)}
                            </div>
                          </td>

                          {/* Policy */}
                          <td className="px-3 py-3 sm:px-4 sm:py-4 2xl:px-5">
                            <div className="font-semibold">{policyLabel(r.payroll_policy_id)}</div>
                          </td>

                          {/* Base */}
                          <td className="px-3 py-3 sm:px-4 sm:py-4 2xl:px-5">
                            {fmtMoney(r.base_salary)}
                          </td>

                          {/* Gross */}
                          <td className="px-3 py-3 font-extrabold text-emerald-700 sm:px-4 sm:py-4 2xl:px-5">
                            {fmtMoney(r.gross_salary)}
                          </td>

                          {/* Deduction */}
                          <td className="px-3 py-3 font-extrabold text-red-600 sm:px-4 sm:py-4 2xl:px-5">
                            -{fmtMoney(t.deduction)}
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-3 sm:px-4 sm:py-4 2xl:px-5">
                            <div className="flex justify-end gap-2">
                              <Btn
                                type="button"
                                onClick={() => onEdit(r)}
                                className="border border-gray-200 bg-white hover:bg-gray-50"
                              >
                                <MdEdit className="text-base text-[#FF5800] sm:text-lg" />
                              </Btn>
                              <Btn
                                type="button"
                                onClick={() => onDelete(r.id)}
                                disabled={deleting}
                                className="border border-red-200 bg-white text-[#991B1B] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <MdDeleteOutline className="text-base sm:text-lg" />
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

      {/* ── Modal portal ── */}
      {modalOpen &&
        createPortal(
          <SalaryModal
            open={modalOpen}
            onClose={closeModal}
            editingId={editingId}
            departments={departments}
            deptLoading={deptLoading}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            employees={employees}
            setEmployees={setEmployees}
            empLoading={empLoading}
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
            rows={rows}
          />,
          document.body
        )}
    </div>
  );
}
