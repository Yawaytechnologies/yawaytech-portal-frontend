import React, { useEffect, useMemo, useState } from "react";
import Card, { StatusChip } from "./Card";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyLeaveRequests,
  cancelLeaveRequest,
} from "../../redux/actions/leaveActions";
import {
  selectMyLeaveRequests,
  selectLeaveLoading,
} from "../../redux/reducer/leaveSlice";

export default function MyRequests() {
  const dispatch = useDispatch();
  const rows = useSelector(selectMyLeaveRequests);
  const loading = useSelector(selectLeaveLoading);
  const [filter, setFilter] = useState("all");

  const load = () => dispatch(fetchMyLeaveRequests());
  useEffect(() => { load(); }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    if (!rows) return [];
    return filter === "all" ? rows : rows.filter(r => r.status === filter);
  }, [rows, filter]);

  const onCancel = (id) => dispatch(cancelLeaveRequest(id));

  return (
    <Card
      title="My Requests"
      right={
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
          >
            {["all","submitted","approved","rejected","changes_requested","cancelled"].map(x => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
          <button onClick={load} className="px-3 py-1.5 rounded-lg text-sm border border-white/10 hover:bg-white/10">
            {loading.myRequests ? "Loading…" : "Reload"}
          </button>
        </div>
      }
    >
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-3 py-2 text-left">Req ID</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2">From</th>
              <th className="px-3 py-2">To</th>
              <th className="px-3 py-2">Units</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {!rows?.length ? (
              <tr><td className="px-3 py-6 text-center text-white/60" colSpan={7}>
                {loading.myRequests ? "Loading…" : "No requests"}
              </td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="px-3 py-2">{r.id}</td>
                <td className="px-3 py-2">{r.policyCode || r.permissionCode || r.kind}</td>
                <td className="px-3 py-2 text-center">{r.startDate}</td>
                <td className="px-3 py-2 text-center">{r.endDate}</td>
                <td className="px-3 py-2 text-center">{r.requestedUnits ?? "-"}</td>
                <td className="px-3 py-2"><StatusChip status={r.status}/></td>
                <td className="px-3 py-2 text-right">
                  {r.status === "submitted" && (
                    <button
                      onClick={() => onCancel(r.id)}
                      className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500"
                    >
                      {loading.cancel ? "..." : "Cancel"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
