import React, { useEffect, useState } from "react";
import Card, { StatusChip } from "./Card";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchApprovalsQueue,
  actOnApproval,
} from "../../redux/actions/leaveActions";
import {
  selectLeaveApprovals,
  selectLeaveLoading,
} from "../../redux/reducer/leaveSlice";

export default function Approvals() {
  const dispatch = useDispatch();
  const rows = useSelector(selectLeaveApprovals);
  const loading = useSelector(selectLeaveLoading);
  const [note, setNote] = useState("");

  const load = () => dispatch(fetchApprovalsQueue());
  useEffect(() => { load(); }, []); // eslint-disable-line

  const act = (id, action) => dispatch(actOnApproval({ id, action, note }));

  return (
    <Card
      title="Approvals (HR/Manager)"
      right={
        <div className="flex items-center gap-2">
          <input
            value={note}
            onChange={(e)=>setNote(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
            placeholder="Optional note"
          />
          <button onClick={load} className="px-3 py-1.5 rounded-lg text-sm border border-white/10 hover:bg-white/10">
            {loading.approvals ? "Loading…" : "Reload"}
          </button>
        </div>
      }
    >
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-3 py-2 text-left">Req ID</th>
              <th className="px-3 py-2 text-left">Employee</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2">Dates</th>
              <th className="px-3 py-2">Units</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {!rows?.length ? (
              <tr><td className="px-3 py-6 text-center text-white/60" colSpan={7}>
                {loading.approvals ? "Loading…" : "No items"}
              </td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="px-3 py-2">{r.id}</td>
                <td className="px-3 py-2">{r.employeeName || r.employeeId}</td>
                <td className="px-3 py-2">{r.policyCode}</td>
                <td className="px-3 py-2 text-center">{r.startDate} → {r.endDate}</td>
                <td className="px-3 py-2 text-center">{r.requestedUnits}</td>
                <td className="px-3 py-2"><StatusChip status={r.status}/></td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={()=>act(r.id, "approve")} className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500">
                      {loading.act ? "…" : "Approve"}
                    </button>
                    <button onClick={()=>act(r.id, "reject")} className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500">
                      {loading.act ? "…" : "Reject"}
                    </button>
                    <button onClick={()=>act(r.id, "changes")} className="px-3 py-1.5 rounded bg-amber-500/90 hover:bg-amber-500">
                      {loading.act ? "…" : "Ask Changes"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
