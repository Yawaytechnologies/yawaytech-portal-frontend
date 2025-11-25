import React, { useEffect, useMemo, useState } from "react";
import Card from "./Card";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLeavePolicies,
  fetchLeavePermissions,
  submitLeaveRequest,
} from "../../redux/actions/leaveActions";
import {
  selectLeaveLoading,
  selectLeavePolicies,
  selectLeavePermissions,
} from "../../redux/reducer/leaveSlice";

export default function ApplyLeave() {
  const dispatch = useDispatch();
  const loading = useSelector(selectLeaveLoading);
  const policies = useSelector(selectLeavePolicies);
  const permissions = useSelector(selectLeavePermissions);

  const [form, setForm] = useState({
    kind: "LEAVE",
    policyCode: "EL",
    permissionCode: "",
    startDate: "",
    endDate: "",
    half: "none",
    reason: "",
  });
  const [toast, setToast] = useState("");

  useEffect(() => {
    dispatch(fetchLeavePolicies());
    dispatch(fetchLeavePermissions());
  }, [dispatch]);

  const submitting = loading.submit;

  const canSubmit = useMemo(() => {
    if (form.kind === "PERMISSION") return true;
    return !!form.startDate && !!form.endDate;
  }, [form]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setToast("Pick From/To dates");
      setTimeout(() => setToast(""), 1600);
      return;
    }
    await dispatch(submitLeaveRequest(form));
    setToast("Request submitted ✔");
    setForm((f) => ({ ...f, startDate: "", endDate: "", half: "none", reason: "" }));
    setTimeout(() => setToast(""), 1800);
  };

  return (
    <Card title="Apply Leave / Permission">
      {toast && <div className="mb-3 text-sm rounded bg-white text-black inline-block px-3 py-1">{toast}</div>}

      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid md:grid-cols-4 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-white/70">Kind</span>
            <select
              name="kind"
              value={form.kind}
              onChange={onChange}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            >
              <option value="LEAVE">Leave</option>
              <option value="PERMISSION">Permission</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-white/70">Leave Type</span>
            <select
              name="policyCode"
              value={form.policyCode}
              onChange={onChange}
              disabled={form.kind !== "LEAVE"}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            >
              {policies.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.code} — v{p.version}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-white/70">Permission</span>
            <select
              name="permissionCode"
              value={form.permissionCode}
              onChange={onChange}
              disabled={form.kind !== "PERMISSION"}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            >
              <option value="">—</option>
              {permissions.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-1 text-sm">
            <span className="text-white/70">Units</span>
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              {form.kind === "PERMISSION" ? "-" : "Auto (server-calculated)"}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-white/70">From</span>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={onChange}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-white/70">To</span>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={onChange}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-white/70">Half Day</span>
            <select
              name="half"
              value={form.half}
              onChange={onChange}
              disabled={form.kind !== "LEAVE"}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            >
              <option value="none">None</option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-white/70">Reason</span>
          <textarea
            rows={3}
            name="reason"
            value={form.reason}
            onChange={onChange}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            placeholder="Optional"
          />
        </label>

        <div>
          <button
            disabled={!canSubmit || submitting}
            className={`px-4 py-2 rounded-lg font-medium ${
              submitting ? "opacity-70 cursor-not-allowed bg-white text-black" : "bg-white text-black hover:opacity-90"
            }`}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </Card>
  );
}
