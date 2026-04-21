import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRequests,
  decideRequest,
  setParams,
} from "../../redux/reducer/leaverequestsSlice";
import Chip from "./ui/Chip";
import cx from "./ui/cx";

function StatusChip({ status }) {
  const normalized = String(status || "").trim();
  const tone =
    normalized === "Approved"
      ? "green"
      : normalized === "Rejected"
      ? "red"
      : "amber";

  return <Chip tone={tone}>{normalized || "Pending"}</Chip>;
}

function normalizeHalfLabel(row) {
  if (row?.half) return row.half;

  const unit = String(row?.requested_unit || "").toUpperCase();
  const hours = Number(row?.requested_hours || 0);
  const days = Number(row?.requested_days || row?.days || 0);

  if (unit === "HOUR") return `${hours || 0}h`;
  if (days === 0.5) return "Half";
  return "—";
}

function normalizeDays(row) {
  return row?.requested_days ?? row?.days ?? 0;
}

export default function RequestsPanel() {
  const dispatch = useDispatch();
  const { items, params, loading, error } = useSelector((s) => s.requests);

  const [actionNotes, setActionNotes] = useState({});

  useEffect(() => {
    dispatch(fetchRequests(params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.type, params.status]);

  const reload = () => dispatch(fetchRequests(params));
  const change = (p) => dispatch(setParams(p));

  const filteredItems = useMemo(() => {
    const q = String(params.q || "").trim().toLowerCase();
    if (!q) return items || [];

    return (items || []).filter((r) => {
      const bag = [
        r?.id,
        r?.employee_name,
        r?.employee_id,
        r?.leave_type_code,
        r?.start_date,
        r?.end_date,
        r?.reason,
        r?.status,
      ]
        .join(" ")
        .toLowerCase();

      return bag.includes(q);
    });
  }, [items, params.q]);

const act = async (id, action) => {
  const note = String(actionNotes[id] || "").trim();
  const approverEmployeeId = String(
  items.find((r) => String(r.id) === String(id))?.employee_id || ""
)
  .trim()
  .toUpperCase();

  console.log("RequestsPanel approverEmployeeId:", approverEmployeeId);
  console.log("RequestsPanel action:", action);
  const res = await dispatch(
    decideRequest({
      id,
      action,
      note,
      approverEmployeeId,
    })
  );

    if (!res.error) {
      setActionNotes((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const setRowNote = (id, value) => {
    setActionNotes((prev) => ({ ...prev, [id]: value }));
  };

  const inputCls =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none " +
    "focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400";

  return (
    <div className="grid gap-4 text-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Employee Requests</h3>
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="text-sm text-slate-500">
              Review and update leave requests
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            className={cx(inputCls, "w-56")}
            placeholder="Search (name/id/req)…"
            value={params.q}
            onChange={(e) => change({ q: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && reload()}
          />

          <select
            className={inputCls}
            value={params.type}
            onChange={(e) => change({ type: e.target.value })}
          >
            <option>All</option>
            <option>EL</option>
            <option>CL</option>
            <option>SL</option>
            <option>SHORT</option>
            <option>PR</option>
            <option>CGR</option>
          </select>

          <select
            className={inputCls}
            value={params.status}
            onChange={(e) => change({ status: e.target.value })}
          >
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>All</option>
          </select>

          <button
            className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200 text-slate-900"
            onClick={reload}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-800">
            <tr>
              <th className="p-2 text-left font-semibold">Req ID</th>
              <th className="p-2 text-left font-semibold">Employee</th>
              <th className="p-2 text-left font-semibold">Type</th>
              <th className="p-2 text-center font-semibold">Dates</th>
              <th className="p-2 text-center font-semibold">Days</th>
              <th className="p-2 text-left font-semibold">Half / Hours</th>
              <th className="p-2 text-left font-semibold">Reason</th>
              <th className="p-2 text-left font-semibold">Status</th>
              <th className="p-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="text-slate-900">
            {loading ? (
              <tr>
                <td className="p-4" colSpan={9}>
                  Loading…
                </td>
              </tr>
            ) : filteredItems.length ? (
              filteredItems.map((r) => {
                const rowNote = actionNotes[r.id] ?? "";
                const isPending = String(r.status || "").trim() === "Pending";

                return (
                  <tr key={r.id} className="border-b border-slate-200">
                    <td className="p-2 font-mono">{r.id}</td>

                    <td className="p-2">
                      <div className="font-medium">{r.employee_name}</div>
                      <div className="text-xs text-slate-500">
                        {r.employee_id}
                      </div>
                    </td>

                    <td className="p-2">{r.leave_type_code}</td>

                    <td className="p-2 text-center align-middle">
                      <div className="inline-flex flex-col items-center leading-tight">
                        <span className="font-medium">{r.start_date}</span>
                        <span className="text-xs text-slate-400">↓</span>
                        <span className="font-medium">{r.end_date}</span>
                      </div>
                    </td>

                    <td className="p-2 text-center">{normalizeDays(r)}</td>

                    <td className="p-2">{normalizeHalfLabel(r)}</td>

                    <td className="p-2 max-w-[240px] truncate" title={r.reason}>
                      {r.reason}
                    </td>

                    <td className="p-2">
                      <StatusChip status={r.status} />
                    </td>

                    <td className="p-2">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          className={cx(inputCls, "w-44")}
                          placeholder="Note (optional)"
                          value={rowNote}
                          onChange={(e) => setRowNote(r.id, e.target.value)}
                        />

                        <button
                          disabled={!isPending || loading}
                          className={cx(
                            "rounded-lg px-2 py-1 text-white disabled:opacity-50",
                            "bg-green-600 hover:bg-green-700"
                          )}
                          onClick={() => act(r.id, "approve", r.employee_id)}
                        >
                          APPROVE
                        </button>

                        <button
                          disabled={!isPending || loading}
                          className={cx(
                            "rounded-lg px-2 py-1 text-white disabled:opacity-50",
                            "bg-red-600 hover:bg-red-700"
                          )}
                          onClick={() => act(r.id, "reject", r.employee_id)}
                        >
                          REJECT
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="p-4" colSpan={9}>
                  No requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
