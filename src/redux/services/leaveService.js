// src/services/leaveService.js

// Simple in-memory mock. Swap with real API calls later.
const db = {
  policies: [
    { id: "EL-v3", code: "EL", name: "Earned Leave", version: 3, effectiveFrom: "2026-04-01", halfDay: true, status: "published" },
    { id: "CL-v2", code: "CL", name: "Casual Leave", version: 2, effectiveFrom: "2026-04-01", halfDay: true, status: "published" },
  ],
  permissions: [
    { code: "LATE", name: "Late Permission" },
    { code: "EARLY", name: "Early Exit" },
    { code: "SHORT", name: "Short Break" },
  ],
  balances: { EL: 6.5, CL: 3.0, SL: 0, CO: 0 },
  requests: [
    { id: "REQ-1026", employeeId: "YTPL019IT", policyCode: "CL", requestedUnits: 1, startDate: "2025-11-02", endDate: "2025-11-02", status: "approved" },
  ],
  approvals: [
    { id: "REQ-2001", employeeId: "YTP000015", employeeName: "Priya", policyCode: "EL", requestedUnits: 2, startDate: "2025-12-11", endDate: "2025-12-12", status: "submitted" },
  ],
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function calcUnits(start, end, half) {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  let days = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay(); // skip weekends
    if (wd === 0 || wd === 6) continue;
    days += 1;
  }
  if (half === "AM" || half === "PM") days -= 0.5;
  return Math.max(0, days);
}

const leaveApi = {
  async listPolicies() { await sleep(120); return [...db.policies]; },
  async listPermissions() { await sleep(80); return [...db.permissions]; },
  async listBalances() { await sleep(80); return { ...db.balances }; },
  async listMyRequests() { await sleep(140); return [...db.requests].sort((a,b)=>b.id.localeCompare(a.id)); },

  async createAndSubmit({ kind, policyCode, permissionCode, startDate, endDate, half, reason }) {
    await sleep(150);
    const id = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const requestedUnits = kind === "PERMISSION" ? null : calcUnits(startDate, endDate, half);
    const req = {
      id, employeeId: "YTPL019IT", policyCode, permissionCode, startDate, endDate,
      requestedUnits, status: "submitted", kind, reason
    };
    db.requests.unshift(req);
    db.approvals.unshift({
      id, employeeId: req.employeeId, employeeName: "Employee",
      policyCode: policyCode || permissionCode || kind, requestedUnits: requestedUnits ?? "-",
      startDate, endDate, status: "submitted",
    });
    return req;
  },

  async cancelRequest(id) {
    await sleep(80);
    const r = db.requests.find(x=>x.id===id);
    if (r) r.status = "cancelled";
    return r;
  },

  async adminListApprovals() { await sleep(140); return [...db.approvals]; },

  async adminActOnApproval(id, action, note) {
    await sleep(120);
    const row = db.approvals.find(a => a.id === id);
    if (!row) throw new Error("Not found");
    if (action === "approve") row.status = "hr_approved";
    if (action === "reject") row.status = "rejected";
    if (action === "changes") row.status = "changes_requested";
    row.note = note || "";

    const req = db.requests.find(r => r.id === id);
    if (req) req.status = row.status === "hr_approved" ? "approved" : row.status;
    return row;
  },

  async adminAdjustBalance({ policyCode, delta, reason }) {
    await sleep(100);
    db.balances[policyCode] = (db.balances[policyCode] || 0) + Number(delta);
    return { policyCode, available: db.balances[policyCode] };
  },

  async createPolicyDraft({ code, name, effectiveFrom, halfDay }) {
    await sleep(120);
    const nextVer = 1 + Math.max(0, ...db.policies.filter(p=>p.code===code).map(p=>p.version||0));
    const draft = { id: `${code}-v${nextVer}`, code, name: name || code, version: nextVer, effectiveFrom, halfDay: !!halfDay, status: "draft" };
    db.policies.unshift(draft);
    return draft;
  },

  async publishPolicy(id) {
    await sleep(80);
    const p = db.policies.find(x=>x.id===id);
    if (!p) throw new Error("Draft not found");
    p.status = "published";
    return p;
  },
};

export const leaveService = {
  listPolicies: () => leaveApi.listPolicies(),
  listPermissions: () => leaveApi.listPermissions(),
  listBalances: () => leaveApi.listBalances(),
  listMyRequests: () => leaveApi.listMyRequests(),

  createAndSubmit: (payload) => leaveApi.createAndSubmit(payload),
  cancelRequest: (id) => leaveApi.cancelRequest(id),

  adminListApprovals: () => leaveApi.adminListApprovals(),
  adminActOnApproval: (id, action, note) => leaveApi.adminActOnApproval(id, action, note),

  adminAdjustBalance: (payload) => leaveApi.adminAdjustBalance(payload),

  createPolicyDraft: (payload) => leaveApi.createPolicyDraft(payload),
  publishPolicy: (id) => leaveApi.publishPolicy(id),
};

export default leaveService;
