import React, { useEffect, useState } from "react";
import Card from "./Card";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLeaveBalances,
  adjustLeaveBalance,
} from "../../redux/actions/leaveActions";
import {
  selectLeaveBalances,
  selectLeaveLoading,
} from "../../redux/reducer/leaveSlice";

export default function BalanceAdjust() {
  const dispatch = useDispatch();
  const balances = useSelector(selectLeaveBalances);
  const loading = useSelector(selectLeaveLoading);

  const [form, setForm] = useState({ policyCode: "EL", delta: 1, reason: "Grant" });

  const load = () => dispatch(fetchLeaveBalances());
  useEffect(() => { load(); }, []); // eslint-disable-line

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(adjustLeaveBalance({ policyCode: form.policyCode, delta: Number(form.delta), reason: form.reason }));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card title="Adjust Employee Balance">
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <select
              value={form.policyCode}
              onChange={(e)=>setForm(f=>({...f, policyCode:e.target.value}))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              {["EL","CL","SL","CO"].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            <input
              type="number"
              step="0.5"
              value={form.delta}
              onChange={(e)=>setForm(f=>({...f, delta:e.target.value}))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
              placeholder="± days"
            />
          </div>
          <input
            value={form.reason}
            onChange={(e)=>setForm(f=>({...f, reason:e.target.value}))}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
            placeholder="Reason (required)"
          />
          <button
            className={`px-4 py-2 rounded-lg font-medium ${
              loading.adjust ? "opacity-70 cursor-not-allowed bg-white text-black" : "bg-white text-black hover:opacity-90"
            }`}
          >
            {loading.adjust ? "Saving…" : "Save Adjustment"}
          </button>
        </form>
      </Card>

      <Card title="Current Balances">
        {!Object.keys(balances || {}).length ? (
          <div className="text-white/60">{loading.balances ? "Loading…" : "No balances"}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(balances).map(([code, val]) => (
              <div key={code} className="rounded-lg p-3 bg-white/5 border border-white/10">
                <div className="text-xs text-white/60">{code}</div>
                <div className="text-2xl font-bold">{val}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
