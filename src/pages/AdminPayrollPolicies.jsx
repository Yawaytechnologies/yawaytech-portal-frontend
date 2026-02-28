// src/pages/AdminPayrollPolicies.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, Slide } from "react-toastify";
import { MdAdd, MdDeleteOutline, MdEdit, MdRefresh, MdSave } from "react-icons/md";

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
const STYLE_OK = { ...PILL, background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" };
const STYLE_ERR = { ...PILL, background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" };

const isoToday = () => new Date().toISOString().slice(0, 10);

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

function Field({ label, children, hint }) {
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

const RULE_TYPES = ["ALLOWANCE", "DEDUCTION"];
const APPLIES_TO_HINT = "ex: ALL, fixed, gross, base_salary, overtime, attendance_bonus";

export default function AdminPayrollPolicies() {
  const dispatch = useDispatch();

  const items = useSelector(selectPolicies);
  const loading = useSelector(selectPoliciesLoading);
  const saving = useSelector(selectPoliciesSaving);
  const deleting = useSelector(selectPoliciesDeleting);
  const error = useSelector(selectPoliciesError);

  // list filters
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  // form
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
    if (error) toast(String(error), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
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
        return a.includes(query) || b.includes(query) || String(p?.id || "").includes(query);
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

    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const validate = () => {
    if (!name.trim()) return "Enter policy name";
    if (!effectiveFrom) return "Select effective_from date";

    if (!Array.isArray(rules) || rules.length === 0) return "Add at least 1 rule";

    for (const r of rules) {
      if (!String(r.rule_name || "").trim()) return "Each rule needs rule_name";
      if (!RULE_TYPES.includes(String(r.rule_type || ""))) return "Rule type must be ALLOWANCE/DEDUCTION";
      if (String(r.applies_to || "").trim() === "") return "Each rule needs applies_to";
      if (Number.isNaN(Number(r.value))) return "Rule value must be number";
    }
    return null;
  };

  const onSave = async () => {
    const msg = validate();
    if (msg) {
      toast(msg, { ...TOAST_BASE, style: STYLE_ERR, icon: false });
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
        toast("Policy created", { ...TOAST_BASE, style: STYLE_OK, icon: false });
        clearForm();
        refresh();
      } else {
        toast(String(res.payload || "Create failed"), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
      }
      return;
    }

    const res = await dispatch(updatePayrollPolicyThunk({ policyId: editingId, payload }));
    if (updatePayrollPolicyThunk.fulfilled.match(res)) {
      toast("Policy updated", { ...TOAST_BASE, style: STYLE_OK, icon: false });
      clearForm();
      refresh();
    } else {
      toast(String(res.payload || "Update failed"), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
    }
  };

  const onDelete = async (policyId) => {
    const res = await dispatch(deletePayrollPolicyThunk({ policyId }));
    if (deletePayrollPolicyThunk.fulfilled.match(res)) {
      toast("Deleted", { ...TOAST_BASE, style: STYLE_OK, icon: false });
      refresh();
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
            <h1 className="text-xl sm:text-2xl font-extrabold">Payroll Policies</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip tone="orange">{loading ? "Loading..." : "Ready"}</Chip>
              <Chip tone="dark">{filtered.length} policy(s)</Chip>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Btn
              type="button"
              onClick={refresh}
              className="border border-gray-200 bg-white hover:bg-gray-50"
            >
              <MdRefresh className="text-[#FF5800]" /> Refresh
            </Btn>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* form */}
          <div className="xl:col-span-5 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="text-sm font-extrabold">
                {editingId ? `Edit Policy (ID: ${editingId})` : "Create Policy"}
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
              <Field label="Policy Name" hint="name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: IT Standard Policy"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm
                  placeholder:text-[#0e1b34]/40 outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                />
              </Field>

              <Field label="Description" hint="description">
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Short description"
                  className="min-h-[84px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm
                  placeholder:text-[#0e1b34]/40 outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Effective From" hint="effective_from">
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm
                    outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                  />
                </Field>

                <Field label="Effective To" hint="effective_to (optional)">
                  <input
                    type="date"
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm
                    outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2">
                <div className="text-xs font-extrabold">Active</div>
                <label className="inline-flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 accent-[#FF5800]"
                  />
                  {isActive ? "Yes" : "No"}
                </label>
              </div>

              {/* Rules */}
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="text-sm font-extrabold">Rules</div>
                  <Btn
                    type="button"
                    onClick={addRule}
                    className="border border-gray-200 bg-white hover:bg-gray-50"
                  >
                    <MdAdd className="text-[#FF5800] text-lg" /> Add Rule
                  </Btn>
                </div>

                <div className="p-4 space-y-3">
                  {rules.map((r, idx) => (
                    <div key={idx} className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-extrabold">Rule #{idx + 1}</div>
                        {rules.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeRule(idx)}
                            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#991B1B] hover:underline"
                          >
                            <MdDeleteOutline className="text-lg" /> Remove
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Field label="rule_name">
                          <input
                            value={r.rule_name}
                            onChange={(e) => updateRule(idx, { rule_name: e.target.value })}
                            placeholder="ex: PF / ESI / Allowance"
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm
                            placeholder:text-[#0e1b34]/40 outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                          />
                        </Field>

                        <Field label="rule_type">
                          <select
                            value={r.rule_type}
                            onChange={(e) => updateRule(idx, { rule_type: e.target.value })}
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm
                            outline-none focus:ring-2 focus:ring-[#FF5800]/25"
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
                            onChange={(e) => updateRule(idx, { value: e.target.value })}
                            inputMode="numeric"
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm
                            outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                          />
                        </Field>

                        <Field label="applies_to" hint={APPLIES_TO_HINT}>
                          <input
                            value={r.applies_to}
                            onChange={(e) => updateRule(idx, { applies_to: e.target.value })}
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm
                            placeholder:text-[#0e1b34]/40 outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                          />
                        </Field>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4">
                        <label className="inline-flex items-center gap-2 text-xs font-extrabold">
                          <input
                            type="checkbox"
                            checked={!!r.is_enabled}
                            onChange={(e) => updateRule(idx, { is_enabled: e.target.checked })}
                            className="h-4 w-4 accent-[#FF5800]"
                          />
                          is_enabled
                        </label>

                        <label className="inline-flex items-center gap-2 text-xs font-extrabold">
                          <input
                            type="checkbox"
                            checked={!!r.is_percentage}
                            onChange={(e) => updateRule(idx, { is_percentage: e.target.checked })}
                            className="h-4 w-4 accent-[#FF5800]"
                          />
                          is_percentage
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
            </div>
          </div>

          {/* list */}
          <div className="xl:col-span-7 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm font-extrabold">Policies (GET)</div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search id/name/description"
                  className="h-10 w-[220px] rounded-xl border border-gray-200 bg-white px-3 text-sm
                  placeholder:text-[#0e1b34]/40 outline-none focus:ring-2 focus:ring-[#FF5800]/25"
                />
                <label className="inline-flex items-center gap-2 text-xs font-extrabold rounded-xl border border-gray-200 bg-white px-3 h-10">
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

            <div className="p-4 bg-[#f8fafc] max-h-[78vh] overflow-auto space-y-3">
              {filtered.length === 0 && !loading ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                  <div className="text-sm font-extrabold">No policies</div>
                </div>
              ) : (
                filtered.map((p) => (
                  <div key={String(p.id)} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 items-center">
                          <Chip tone="dark">ID: {p.id}</Chip>
                          <Chip tone={p.is_active ? "orange" : "neutral"}>
                            {p.is_active ? "Active" : "Inactive"}
                          </Chip>
                          <div className="text-sm font-extrabold">{p.name}</div>
                        </div>

                        <div className="mt-2 text-sm text-[#0e1b34]/80">
                          {p.description || "—"}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#0e1b34]/70">
                          <span>from: <b>{p.effective_from}</b></span>
                          <span>to: <b>{p.effective_to ?? "—"}</b></span>
                          <span>rules: <b>{Array.isArray(p.rules) ? p.rules.length : 0}</b></span>
                        </div>

                        {/* rules preview */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(p.rules || []).map((r) => (
                            <div key={String(r.id)} className="rounded-xl border border-gray-200 bg-[#f8fafc] p-3">
                              <div className="text-xs font-extrabold">{r.rule_name}</div>
                              <div className="text-[11px] text-[#0e1b34]/70 mt-0.5">
                                {r.rule_type} • {r.is_percentage ? `${r.value}%` : r.value} • applies_to: {r.applies_to}
                              </div>
                              <div className="text-[11px] font-extrabold mt-1">
                                enabled: {String(!!r.is_enabled)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 lg:flex-col lg:items-end">
                        <Btn
                          type="button"
                          onClick={() => onEdit(p)}
                          className="border border-gray-200 bg-white hover:bg-gray-50"
                        >
                          <MdEdit className="text-[#FF5800] text-lg" /> Edit
                        </Btn>

                        <Btn
                          type="button"
                          onClick={() => onDelete(p.id)}
                          disabled={deleting}
                          className="border border-red-200 bg-white text-[#991B1B] hover:bg-red-50"
                        >
                          <MdDeleteOutline className="text-lg" /> Delete
                        </Btn>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t text-[11px] text-[#0e1b34]/70 bg-white">
              Endpoints: POST /policies/ • GET /policies/ • GET /policies/:policy_id • PUT /policies/:policy_id • DELETE /policies/:policy_id
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}