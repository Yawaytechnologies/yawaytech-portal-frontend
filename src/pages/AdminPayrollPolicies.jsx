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
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${toneCls}`}
    >
      {children}
    </span>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-sm font-extrabold text-[#0e1b34] sm:text-base 2xl:text-lg">
          {label}
        </div>
        {hint ? (
          <div className="text-xs text-[#0e1b34]/70 sm:text-sm 2xl:text-base">
            {hint}
          </div>
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
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold transition sm:gap-2 sm:px-4 sm:text-base 2xl:px-5 2xl:text-lg ${className}`}
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/45 p-2 backdrop-blur-[1px] sm:p-4 xl:p-6 2xl:p-8">
      <div
        className="flex w-full max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-2xl border border-white/40 bg-white shadow-2xl sm:max-w-[600px] sm:rounded-[28px] md:max-w-[720px] lg:max-w-[860px] xl:max-w-[1000px] 2xl:max-w-[1160px]"
        style={{ maxHeight: "calc(100dvh - 16px)" }}
      >
        <div className="shrink-0 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#0e1b34] to-[#1d3b8b] px-3 py-3 text-white sm:px-5 sm:py-4 xl:px-7 xl:py-5 2xl:px-8">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/90 sm:text-sm 2xl:text-base">
              Payroll Management
            </div>

            <h2 className="mt-1 text-xl font-extrabold sm:text-2xl 2xl:text-3xl">
              {editingId
                ? `Edit Policy #${editingId}`
                : "Create Payroll Policy"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:h-10 sm:w-10 2xl:h-11 2xl:w-11"
          >
            <MdClose className="text-base sm:text-xl 2xl:text-2xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 xl:p-6 2xl:p-8">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 2xl:gap-5">
            <Field label="Policy Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: IT Standard Policy"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-black placeholder:text-[#0e1b34]/50 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-12 sm:text-base xl:h-13 2xl:text-lg"
              />
            </Field>

            <div className="flex items-center justify-between rounded-sm border border-gray-200 bg-[#f8fafc] px-2 py-2 sm:rounded-xl sm:px-5 sm:py-3.5 2xl:px-6">
              <div className="text-sm font-extrabold text-[#0e1b34] sm:text-base 2xl:text-lg">
                Active
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-[#0e1b34] sm:text-base 2xl:text-lg">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-[#FF5800] sm:h-3 sm:w-3"
                />
                {isActive ? "Yes" : "No"}
              </label>
            </div>

            <div className="md:col-span-2">
              <Field label="Description">
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Short description"
                  className="min-h-[90px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0e1b34] placeholder:text-[#0e1b34]/50 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:min-h-[110px] sm:text-base 2xl:text-lg"
                />
              </Field>
            </div>

            <Field label="Effective From">
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="h-11 w-full min-w-0 rounded-2xl border border-gray-200 bg-white px-1 text-xs text-[#0e1b34] outline-none ... sm:px-3 sm:text-sm md:px-4 md:text-base 2xl:text-lg"
              />
            </Field>

            <Field label="Effective To" hint="(optional)">
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                className="h-11 w-full min-w-0 rounded-2xl border border-gray-200 bg-white px-1 text-xs text-[#0e1b34] outline-none ... sm:px-3 sm:text-sm md:px-4 md:text-base 2xl:text-lg"
              />
            </Field>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white sm:mt-5">
            <div className="flex items-center justify-between border-b px-3 py-2.5 sm:px-4 sm:py-3 2xl:px-5 2xl:py-4">
              <div>
                <div className="text-sm font-extrabold text-[#0e1b34] sm:text-base 2xl:text-lg">
                  Rules
                </div>
              </div>

              <Btn
                type="button"
                onClick={addRule}
                className="border border-gray-200 bg-black hover:bg-gray-50"
              >
                <MdAdd className="text-base text-[#FF5800] sm:text-lg" />
                Add Rule
              </Btn>
            </div>

            <div className="space-y-2 p-3 sm:space-y-3 sm:p-4 2xl:p-5">
              {rules.map((r, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-3 sm:p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Chip tone="black">Rule #{idx + 1}</Chip>
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
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-[#991B1B] hover:underline 2xl:text-sm"
                      >
                        <MdDeleteOutline className="text-base sm:text-lg" />
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-1 grid grid-cols-1 gap-2 sm:mt-3 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4 2xl:gap-4">
                    <Field label="Rule Name">
                      <input
                        value={r.rule_name}
                        onChange={(e) =>
                          updateRule(idx, { rule_name: e.target.value })
                        }
                        placeholder="ex: PF / ESI / Bonus"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-11 sm:text-base 2xl:text-lg"
                      />
                    </Field>

                    <Field label="Rule Type">
                      <select
                        value={r.rule_type}
                        onChange={(e) =>
                          updateRule(idx, { rule_type: e.target.value })
                        }
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-11 sm:text-base 2xl:text-lg"
                      >
                        {RULE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="value">
                      <input
                        value={r.value}
                        onChange={(e) =>
                          updateRule(idx, { value: e.target.value })
                        }
                        inputMode="numeric"
                        placeholder="0"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-11 sm:text-base 2xl:text-lg"
                      />
                    </Field>

                    <Field label="Applies To">
                      <input
                        value={r.applies_to}
                        onChange={(e) =>
                          updateRule(idx, { applies_to: e.target.value })
                        }
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] placeholder:text-[#0e1b34]/50 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-11 sm:text-base 2xl:text-lg"
                      />
                    </Field>
                  </div>

                  {/* <div className="mt-2.5 flex flex-wrap gap-3 sm:mt-3 sm:gap-4 2xl:gap-5">
                    <label className="...text-sm font-extrabold text-[#0e1b34] sm:text-base xl:text-sm">
                      <input
                        type="checkbox"
                        checked={!!r.is_enabled}
                        onChange={(e) =>
                          updateRule(idx, { is_enabled: e.target.checked })
                        }
                        className="h-4 w-4 shrink-0 accent-[#FF5800] sm:h-5 sm:w-5"
                      />
                      is_enabled
                    </label>

                    <label className="...text-sm font-extrabold text-[#0e1b34] sm:text-base xl:text-sm">
                      <input
                        type="checkbox"
                        checked={!!r.is_percentage}
                        onChange={(e) =>
                          updateRule(idx, { is_percentage: e.target.checked })
                        }
                        className="h-4 w-4 shrink-0 accent-[#FF5800] sm:h-5 sm:w-5"
                      />
                      is_percentage
                    </label>
                  </div> */}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2.5 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3 2xl:gap-4">
            <Btn
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`h-11 w-full text-white sm:h-12 sm:w-auto sm:min-w-[180px] 2xl:h-13 2xl:min-w-[210px] ${
                saving
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-[#FF5800] hover:bg-[#ff6a1a]"
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
    const ok = window.confirm(`Delete policy #${policyId}?`);
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
    <div className="min-h-screen bg-[#f4f6fa] text-[#0e1b34]">
      <div className="mx-auto w-full max-w-[98%] px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 2xl:max-w-[1600px]">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:rounded-[28px]">
          {/* ── Page header ── */}

          <div className="flex flex-col gap-3 border-b border-gray-200 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between xl:px-6 2xl:px-8 2xl:py-5">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0e1b34]/80 sm:text-[11px] 2xl:text-xs">
                Admin
              </div>

              <h1 className="mt-0.5 text-xl font-extrabold sm:mt-1 sm:text-2xl xl:text-3xl 2xl:text-4xl">
                Payroll Policies
              </h1>
              <div className="mt-1.5 flex flex-wrap gap-2 sm:mt-2">
                <Chip tone="orange">{loading ? "Loading..." : "Ready"}</Chip>
                <Chip tone="dark">{filtered.length} policy(s)</Chip>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Btn
                type="button"
                onClick={refresh}
                className="h-9 border border-gray-200 bg-white hover:bg-gray-50 sm:h-11 2xl:h-12"
              >
                <MdRefresh className="text-[#FF5800]" />
              </Btn>

              <Btn
                type="button"
                onClick={openCreateModal}
                className="h-9 bg-[#4f46e5] text-white hover:bg-[#4338ca] sm:h-11 2xl:h-12"
              >
                <MdAdd className="text-base sm:text-lg" />
                New Policy
              </Btn>
            </div>
          </div>

          {/* ── Search bar ── */}

          <div className="border-b border-gray-200 bg-[#f8fafc] px-3 py-3 sm:px-5 sm:py-4 xl:px-6 2xl:px-8">
            <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search id / name / description"
                className="h-9 rounded-2xl border border-gray-200 bg-white px-3 text-xs placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-10 sm:px-4 sm:text-sm xl:h-11 2xl:text-base"
              />

              <label className="inline-flex h-9 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 text-xs font-extrabold sm:h-10 sm:px-4 sm:text-sm xl:h-11 2xl:text-base">
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

          {/* ── Policy list ── */}

          <div className="p-3 sm:p-4 xl:p-5 2xl:p-6">
            <div className="space-y-2 sm:space-y-3">
              {filtered.length === 0 && !loading ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center sm:p-10">
                  <div className="text-xs font-extrabold sm:text-sm 2xl:text-base">
                    No policies found
                  </div>
                </div>
              ) : (
                filtered.map((p) => (
                  <div
                    key={String(p.id)}
                    className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 2xl:p-5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Chip tone="dark">ID: {p.id}</Chip>
                          <Chip tone={p.is_active ? "green" : "red"}>
                            {p.is_active ? "Active" : "Inactive"}
                          </Chip>

                          <div className="text-sm font-extrabold sm:text-base 2xl:text-lg">
                            {p.name}
                          </div>
                        </div>

                        <div className="mt-1.5 text-xs text-[#0e1b34] sm:mt-2 sm:text-sm 2xl:text-base">
                          {p.description || "—"}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#0e1b34]/90 sm:mt-3 sm:text-[11px] 2xl:text-xs">
                          <span>
                            from: <b>{p.effective_from}</b>
                          </span>
                          <span>
                            to: <b>{p.effective_to ?? "—"}</b>
                          </span>
                          <span>
                            rules:{" "}
                            <b>{Array.isArray(p.rules) ? p.rules.length : 0}</b>
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3 2xl:gap-4">
                          {(p.rules || []).map((r, idx) => (
                            <div
                              key={String(r.id ?? idx)}
                              className="rounded-xl border border-gray-200 bg-[#f8fafc] p-2.5 sm:p-3"
                            >
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <div className="text-xs font-extrabold sm:text-sm 2xl:text-base">
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

                              <div className="mt-1 text-[10px] text-[#0e1b34]/80 sm:text-[11px] 2xl:text-xs">
                                {r.is_percentage ? `${r.value}%` : r.value} •
                                applies_to: {r.applies_to}
                              </div>

                              <div className="mt-0.5 text-[10px] font-extrabold text-[#0e1b34] sm:mt-1 sm:text-[11px] 2xl:text-xs">
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
                          className="h-9 flex-1 border border-gray-200 bg-white hover:bg-gray-50 sm:h-10 lg:flex-none 2xl:h-11"
                        >
                          <MdEdit className="text-base text-[#FF5800] sm:text-lg" />
                        </Btn>

                        <Btn
                          type="button"
                          onClick={() => onDelete(p.id)}
                          disabled={deleting}
                          className="h-9 flex-1 border border-red-200 bg-white text-[#991B1B] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 lg:flex-none 2xl:h-11"
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
