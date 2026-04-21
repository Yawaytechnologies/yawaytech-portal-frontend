import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast, Slide } from "react-toastify";
import {
  MdAdd,
  MdClose,
  MdDeleteOutline,
  MdEdit,
  MdRefresh,
  MdSave,
} from "react-icons/md";

import {
  fetchPayrollPolicies,
  createPayrollPolicyThunk,
  updatePayrollPolicyThunk,
  deletePayrollPolicyThunk,
} from "../redux/actions/payrollPolicyActions";

import {
  selectPolicies,
  selectPoliciesLoading,
  selectPoliciesSaving,
  selectPoliciesDeleting,
  selectPoliciesError,
} from "../redux/reducer/payrollPolicySlice";

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

const isoToday = () => new Date().toISOString().slice(0, 10);

const RULE_TYPES = ["ALLOWANCE", "DEDUCTION"];

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
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold leading-none sm:px-3 sm:text-xs ${toneCls}`}
    >
      {children}
    </span>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-end justify-between gap-2">
        <div className="text-sm font-extrabold text-[#0e1b34] sm:text-[15px] 2xl:text-lg">
          {label}
        </div>
        {hint ? (
          <div className="text-[11px] text-[#0e1b34]/65 sm:text-xs 2xl:text-sm">
            {hint}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Btn({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold transition-all duration-200 sm:gap-2 sm:px-4 sm:text-sm 2xl:px-5 2xl:text-base ${className}`}
    />
  );
}

function PayrollPolicyModal({
  open,
  onClose,
  editingId,
  name,
  setName,
  desc,
  setDesc,
  effectiveFrom,
  setEffectiveFrom,
  effectiveTo,
  setEffectiveTo,
  isActive,
  setIsActive,
  rules,
  addRule,
  removeRule,
  updateRule,
  saving,
  onSave,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0b1120]/55 p-2 backdrop-blur-[3px] sm:p-4 lg:p-6">
      <div
        className="flex w-full max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[22px] border border-white/50 bg-white shadow-[0_25px_80px_rgba(2,6,23,0.30)] sm:max-w-[720px] md:max-w-[860px] lg:max-w-[980px] xl:max-w-[1080px] 2xl:max-w-[1180px]"
        style={{ maxHeight: "calc(100dvh - 16px)" }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 bg-gradient-to-r from-[#0e1b34] via-[#17336f] to-[#22479b] px-4 py-4 text-white sm:px-6 sm:py-5 xl:px-7">
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/80 sm:text-xs">
              Payroll Management
            </div>
            <h2 className="mt-1 text-xl font-black leading-tight sm:text-2xl xl:text-[30px]">
              {editingId ? "Edit Payroll Policy" : "Create Payroll Policy"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-[#f8fafc] p-4 sm:p-5 lg:p-6 xl:p-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-5 2xl:gap-6">
            <Field label="Policy Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: IT Standard Policy"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-[#0e1b34] shadow-sm outline-none transition focus:border-[#FF5800] focus:ring-4 focus:ring-[#FF5800]/10 sm:h-12 sm:text-base"
              />
            </Field>

            <Field label="Status">
              <div className="flex h-11 items-center justify-between rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 shadow-sm sm:h-12 sm:px-5">
                <div className="text-sm font-extrabold text-[#0e1b34] sm:text-base">
                  Active
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-extrabold text-[#0e1b34] sm:text-base">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 accent-[#FF5800]"
                  />
                  <span>{isActive ? "Yes" : "No"}</span>
                </label>
              </div>
            </Field>

            <div className="md:col-span-2">
              <Field label="Description">
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Short description"
                  className="min-h-[110px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0e1b34] shadow-sm outline-none transition placeholder:text-[#0e1b34]/45 focus:border-[#FF5800] focus:ring-4 focus:ring-[#FF5800]/10 sm:text-base"
                />
              </Field>
            </div>

            <Field label="Effective From">
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="h-11 w-full min-w-0 rounded-2xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] shadow-sm outline-none transition focus:border-[#FF5800] focus:ring-4 focus:ring-[#FF5800]/10 sm:h-12 sm:px-4 sm:text-base"
              />
            </Field>

            <Field label="Effective To" hint="optional">
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                className="h-11 w-full min-w-0 rounded-2xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] shadow-sm outline-none transition focus:border-[#FF5800] focus:ring-4 focus:ring-[#FF5800]/10 sm:h-12 sm:px-4 sm:text-base"
              />
            </Field>
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <div className="text-base font-black text-[#0e1b34] sm:text-lg">
                  Rules
                </div>
                <div className="mt-1 text-xs text-[#0e1b34]/60 sm:text-sm">
                  Add allowance or deduction rules for this policy
                </div>
              </div>

              <Btn
                type="button"
                onClick={addRule}
                className="h-10 border border-black bg-black text-white hover:bg-[#111827]"
              >
                <MdAdd className="text-base text-[#FF5800] sm:text-lg" />
                Add Rule
              </Btn>
            </div>

            <div className="space-y-3 p-3 sm:p-4 lg:p-5">
              {rules.map((r, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-3 shadow-sm sm:p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone="dark">Rule #{idx + 1}</Chip>
                      <Chip
                        tone={r.rule_type === "DEDUCTION" ? "red" : "green"}
                      >
                        {r.rule_type}
                      </Chip>
                    </div>

                    {rules.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeRule(idx)}
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-[#991B1B] transition hover:underline sm:text-sm"
                      >
                        <MdDeleteOutline className="text-base sm:text-lg" />
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Rule Name">
                      <input
                        value={r.rule_name}
                        onChange={(e) =>
                          updateRule(idx, { rule_name: e.target.value })
                        }
                        placeholder="ex: PF / ESI / Bonus"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] shadow-sm outline-none transition focus:border-[#FF5800] focus:ring-4 focus:ring-[#FF5800]/10 sm:text-base"
                      />
                    </Field>

                    <Field label="Rule Type">
                      <select
                        value={r.rule_type}
                        onChange={(e) =>
                          updateRule(idx, { rule_type: e.target.value })
                        }
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] shadow-sm outline-none transition focus:border-[#FF5800] focus:ring-4 focus:ring-[#FF5800]/10 sm:text-base"
                      >
                        {RULE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Value">
                      <input
                        value={r.value}
                        onChange={(e) =>
                          updateRule(idx, { value: e.target.value })
                        }
                        inputMode="numeric"
                        placeholder="0"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] shadow-sm outline-none transition focus:border-[#FF5800] focus:ring-4 focus:ring-[#FF5800]/10 sm:text-base"
                      />
                    </Field>

                    <Field label="Applies To">
                      <input
                        value={r.applies_to}
                        onChange={(e) =>
                          updateRule(idx, { applies_to: e.target.value })
                        }
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] shadow-sm outline-none transition placeholder:text-[#0e1b34]/45 focus:border-[#FF5800] focus:ring-4 focus:ring-[#FF5800]/10 sm:text-base"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Btn
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`h-11 w-full rounded-2xl text-white sm:h-12 sm:w-auto sm:min-w-[190px] ${
                saving
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-[#FF5800] shadow-[0_10px_25px_rgba(255,88,0,0.22)] hover:bg-[#ff6a1a]"
              }`}
            >
              <MdSave className="text-base sm:text-lg" />
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Policy"
                  : "Create Policy"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPayrollPolicies() {
  const dispatch = useDispatch();

  const items = useSelector(selectPolicies);
  const loading = useSelector(selectPoliciesLoading);
  const saving = useSelector(selectPoliciesSaving);
  const deleting = useSelector(selectPoliciesDeleting);
  const error = useSelector(selectPoliciesError);

  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(isoToday());
  const [effectiveTo, setEffectiveTo] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [rules, setRules] = useState([
    {
      rule_name: "",
      rule_type: "ALLOWANCE",
      is_enabled: true,
      is_percentage: false,
      value: 0,
      applies_to: "ALL",
    },
  ]);

  const refresh = () => dispatch(fetchPayrollPolicies());

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const filtered = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    const query = q.trim().toLowerCase();

    let out = arr;
    if (onlyActive) out = out.filter((p) => !!p?.is_active);

    if (query) {
      out = out.filter((p) => {
        const a = String(p?.name || "").toLowerCase();
        const b = String(p?.description || "").toLowerCase();
        return (
          a.includes(query) ||
          b.includes(query) ||
          String(p?.id || "").includes(query)
        );
      });
    }

    out = out.slice().sort((a, b) => Number(b.id) - Number(a.id));
    return out;
  }, [items, q, onlyActive]);

  const clearForm = () => {
    setEditingId(null);
    setName("");
    setDesc("");
    setEffectiveFrom(isoToday());
    setEffectiveTo("");
    setIsActive(true);
    setRules([
      {
        rule_name: "",
        rule_type: "ALLOWANCE",
        is_enabled: true,
        is_percentage: false,
        value: 0,
        applies_to: "ALL",
      },
    ]);
  };

  const closeModal = () => {
    setModalOpen(false);
    clearForm();
  };

  const openCreateModal = () => {
    clearForm();
    setModalOpen(true);
  };

  const onEdit = (p) => {
    setEditingId(p.id);
    setName(String(p?.name || ""));
    setDesc(String(p?.description || ""));
    setEffectiveFrom(String(p?.effective_from || isoToday()));
    setEffectiveTo(p?.effective_to ? String(p.effective_to) : "");
    setIsActive(!!p?.is_active);

    const r = Array.isArray(p?.rules) ? p.rules : [];
    setRules(
      r.length
        ? r.map((x) => ({
            rule_name: String(x?.rule_name || ""),
            rule_type: String(x?.rule_type || "ALLOWANCE"),
            is_enabled: !!x?.is_enabled,
            is_percentage: !!x?.is_percentage,
            value: Number(x?.value) || 0,
            applies_to: String(x?.applies_to || "ALL"),
          }))
        : [
            {
              rule_name: "",
              rule_type: "ALLOWANCE",
              is_enabled: true,
              is_percentage: false,
              value: 0,
              applies_to: "ALL",
            },
          ],
    );

    setModalOpen(true);
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        rule_name: "",
        rule_type: "ALLOWANCE",
        is_enabled: true,
        is_percentage: false,
        value: 0,
        applies_to: "ALL",
      },
    ]);
  };

  const removeRule = (idx) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRule = (idx, patch) => {
    setRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );
  };

  const validate = () => {
    if (!name.trim()) return "Enter policy name";
    if (!effectiveFrom) return "Select effective_from date";
    if (!Array.isArray(rules) || rules.length === 0)
      return "Add at least 1 rule";

    for (const r of rules) {
      if (!String(r.rule_name || "").trim()) return "Each rule needs rule_name";
      if (!RULE_TYPES.includes(String(r.rule_type || ""))) {
        return "Rule type must be ALLOWANCE/DEDUCTION";
      }
      if (String(r.applies_to || "").trim() === "") {
        return "Each rule needs applies_to";
      }
      if (Number.isNaN(Number(r.value))) return "Rule value must be number";
    }

    return null;
  };

  const onSave = async () => {
    const msg = validate();
    if (msg) {
      toast(msg, {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
      return;
    }

    const payload = {
      name: name.trim(),
      description: desc.trim() || "",
      effective_from: effectiveFrom,
      effective_to: effectiveTo ? effectiveTo : null,
      is_active: !!isActive,
      rules: rules.map((r) => ({
        rule_name: String(r.rule_name).trim(),
        rule_type: String(r.rule_type),
        is_enabled: !!r.is_enabled,
        is_percentage: !!r.is_percentage,
        value: Number(r.value) || 0,
        applies_to: String(r.applies_to).trim(),
      })),
    };

    if (!editingId) {
      const res = await dispatch(createPayrollPolicyThunk({ payload }));

      if (createPayrollPolicyThunk.fulfilled.match(res)) {
        toast("Policy created", {
          ...TOAST_BASE,
          style: STYLE_OK,
          icon: false,
        });
        closeModal();
        refresh();
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
      updatePayrollPolicyThunk({ policyId: editingId, payload }),
    );

    if (updatePayrollPolicyThunk.fulfilled.match(res)) {
      toast("Policy updated", {
        ...TOAST_BASE,
        style: STYLE_OK,
        icon: false,
      });
      closeModal();
      refresh();
    } else {
      toast(String(res.payload || "Update failed"), {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
    }
  };

  const onDelete = async (policyId) => {
    const ok = window.confirm(`Delete this policy?`);
    if (!ok) return;

    const res = await dispatch(deletePayrollPolicyThunk({ policyId }));

    if (deletePayrollPolicyThunk.fulfilled.match(res)) {
      toast("Deleted", {
        ...TOAST_BASE,
        style: STYLE_OK,
        icon: false,
      });
      refresh();
    } else {
      toast(String(res.payload || "Delete failed"), {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0e1b34]">
      <div className="mx-auto w-full max-w-[1700px] px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
          <div className="flex flex-col gap-4 border-b border-gray-200 bg-gradient-to-r from-white to-[#f8fafc] px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between xl:px-7">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0e1b34]/70 sm:text-[11px]">
                Admin
              </div>

              <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl xl:text-[34px]">
                Payroll Policies
              </h1>

              <div className="mt-2 flex flex-wrap gap-2">
                <Chip tone="orange">{loading ? "Loading..." : "Ready"}</Chip>
                <Chip tone="dark">{filtered.length} policy(s)</Chip>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Btn
                type="button"
                onClick={refresh}
                className="h-10 border border-gray-200 bg-white hover:bg-gray-50 sm:h-11"
              >
                <MdRefresh className="text-[#FF5800]" />
              </Btn>

              <Btn
                type="button"
                onClick={openCreateModal}
                className="h-10 bg-[#4f46e5] text-white shadow-[0_10px_25px_rgba(79,70,229,0.22)] hover:bg-[#4338ca] sm:h-11"
              >
                <MdAdd className="text-base sm:text-lg" />
                New Policy
              </Btn>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-[#f8fafc] px-4 py-4 sm:px-6 xl:px-7">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name or description"
                className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-[#0e1b34] shadow-sm outline-none transition placeholder:text-[#0e1b34]/40 focus:border-[#FF5800] focus:ring-4 focus:ring-[#FF5800]/10"
              />

              <label className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-[#0e1b34] shadow-sm">
                <input
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                  className="h-4 w-4 accent-[#FF5800]"
                />
                Only Active
              </label>
            </div>
          </div>

          <div className="p-3 sm:p-4 lg:p-5 xl:p-6">
            <div className="space-y-3">
              {filtered.length === 0 && !loading ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafafa] p-8 text-center sm:p-10">
                  <div className="text-sm font-black text-[#0e1b34] sm:text-base">
                    No policies found
                  </div>
                </div>
              ) : (
                filtered.map((p) => (
                  <div
                    key={String(p.id)}
                    className="rounded-[22px] border border-gray-200 bg-gradient-to-b from-white to-[#fbfdff] p-4 shadow-sm transition hover:shadow-md sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="truncate text-lg font-black text-[#0e1b34] sm:text-xl">
                              {p.name}
                            </div>
                            <div className="mt-1 text-sm text-[#0e1b34]/70">
                              {p.description || "No description added"}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Chip tone={p.is_active ? "green" : "red"}>
                              {p.is_active ? "Active" : "Inactive"}
                            </Chip>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-[#0e1b34]/85 sm:grid-cols-3 sm:text-sm">
                          <div className="rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2">
                            <span className="font-bold text-[#0e1b34]/65">
                              Effective From:
                            </span>{" "}
                            <span className="font-extrabold text-[#0e1b34]">
                              {p.effective_from}
                            </span>
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2">
                            <span className="font-bold text-[#0e1b34]/65">
                              Effective To:
                            </span>{" "}
                            <span className="font-extrabold text-[#0e1b34]">
                              {p.effective_to ?? "—"}
                            </span>
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2">
                            <span className="font-bold text-[#0e1b34]/65">
                              Rules:
                            </span>{" "}
                            <span className="font-extrabold text-[#0e1b34]">
                              {Array.isArray(p.rules) ? p.rules.length : 0}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {(p.rules || []).map((r, idx) => (
                            <div
                              key={String(r.id ?? idx)}
                              className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-3.5 shadow-sm"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-black text-[#0e1b34] sm:text-base">
                                  {r.rule_name}
                                </div>
                                <Chip
                                  tone={
                                    String(r.rule_type) === "DEDUCTION"
                                      ? "red"
                                      : "green"
                                  }
                                >
                                  {r.rule_type}
                                </Chip>
                              </div>

                              <div className="mt-2 text-xs text-[#0e1b34]/75 sm:text-sm">
                                {r.is_percentage ? `${r.value}%` : r.value} •
                                applies_to:{" "}
                                <span className="font-bold">{r.applies_to}</span>
                              </div>

                              <div className="mt-1 text-xs font-extrabold text-[#0e1b34] sm:text-sm">
                                enabled: {String(!!r.is_enabled)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2 lg:flex-col lg:items-end">
                        <Btn
                          type="button"
                          onClick={() => onEdit(p)}
                          className="h-10 flex-1 border border-gray-200 bg-white hover:bg-gray-50 lg:w-[46px] lg:flex-none"
                        >
                          <MdEdit className="text-base text-[#FF5800] sm:text-lg" />
                        </Btn>

                        <Btn
                          type="button"
                          onClick={() => onDelete(p.id)}
                          disabled={deleting}
                          className="h-10 flex-1 border border-red-200 bg-white text-[#991B1B] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 lg:w-[46px] lg:flex-none"
                        >
                          <MdDeleteOutline className="text-base sm:text-lg" />
                        </Btn>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {modalOpen &&
        createPortal(
          <PayrollPolicyModal
            open={modalOpen}
            onClose={closeModal}
            editingId={editingId}
            name={name}
            setName={setName}
            desc={desc}
            setDesc={setDesc}
            effectiveFrom={effectiveFrom}
            setEffectiveFrom={setEffectiveFrom}
            effectiveTo={effectiveTo}
            setEffectiveTo={setEffectiveTo}
            isActive={isActive}
            setIsActive={setIsActive}
            rules={rules}
            addRule={addRule}
            removeRule={removeRule}
            updateRule={updateRule}
            saving={saving}
            onSave={onSave}
          />,
          document.body,
        )}
    </div>
  );
}