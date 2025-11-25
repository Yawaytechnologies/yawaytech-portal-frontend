import React, { useEffect, useState } from "react";
import Card, { StatusChip } from "./Card";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLeavePolicies,
  createPolicyDraft,
  publishPolicy,
} from "../../redux/actions/leaveActions";
import {
  selectLeavePolicies,
  selectLeaveLoading,
} from "../../redux/reducer/leaveSlice";

export default function PolicyManager() {
  const dispatch = useDispatch();
  const policies = useSelector(selectLeavePolicies);
  const loading = useSelector(selectLeaveLoading);

  const [form, setForm] = useState({ code: "EL", name: "", effectiveFrom: "", halfDay: true });

  const load = () => dispatch(fetchLeavePolicies());
  useEffect(() => { load(); }, []); // eslint-disable-line

  const onSubmit = async (e) => {
    e.preventDefault();
    await dispatch(createPolicyDraft(form));
    setForm({ code: form.code, name: "", effectiveFrom: "", halfDay: true });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card title="Create Policy Draft">
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid md:grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-white/70">Code</span>
              <select
                value={form.code}
                onChange={(e)=>setForm(f=>({...f, code:e.target.value}))}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
              >
                {["EL","CL","SL","CO"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-white/70">Name</span>
              <input
                value={form.name}
                onChange={(e)=>setForm(f=>({...f, name:e.target.value}))}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                placeholder="Display name"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-white/70">Effective From</span>
              <input
                type="date"
                value={form.effectiveFrom}
                onChange={(e)=>setForm(f=>({...f, effectiveFrom:e.target.value}))}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.halfDay}
              onChange={(e)=>setForm(f=>({...f, halfDay:e.target.checked}))}
            />
            Half-day allowed
          </label>

          <button
            className={`px-4 py-2 rounded-lg font-medium ${
              loading.policyDraft ? "opacity-70 cursor-not-allowed bg-white text-black" : "bg-white text-black hover:opacity-90"
            }`}
          >
            {loading.policyDraft ? "Creating…" : "Create Draft"}
          </button>
        </form>
      </Card>

      <Card title="Policies">
        {!policies?.length ? (
          <div className="text-white/60">{loading.policies ? "Loading…" : "No policies"}</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {policies.map(p => (
              <li key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {p.code} <span className="text-white/60">• v{p.version}</span>
                  </div>
                  <div className="text-xs text-white/60">from {p.effectiveFrom}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusChip status={p.status}/>
                  {p.status === "draft" && (
                    <button
                      onClick={()=>dispatch(publishPolicy(p.id))}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500"
                    >
                      {loading.policyPublish ? "…" : "Publish"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
