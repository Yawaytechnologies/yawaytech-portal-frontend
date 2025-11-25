// src/redux/reducer/leaveSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  LEAVE_POLICIES_REQ, LEAVE_POLICIES_OK, LEAVE_POLICIES_ERR,
  LEAVE_PERMS_REQ,   LEAVE_PERMS_OK,   LEAVE_PERMS_ERR,
  LEAVE_BAL_REQ,     LEAVE_BAL_OK,     LEAVE_BAL_ERR,
  LEAVE_MY_REQ_REQ,  LEAVE_MY_REQ_OK,  LEAVE_MY_REQ_ERR,
  LEAVE_SUBMIT_REQ,  LEAVE_SUBMIT_OK,  LEAVE_SUBMIT_ERR,
  LEAVE_CANCEL_REQ,  LEAVE_CANCEL_OK,  LEAVE_CANCEL_ERR,
  LEAVE_APPROVALS_REQ, LEAVE_APPROVALS_OK, LEAVE_APPROVALS_ERR,
  LEAVE_ACT_REQ, LEAVE_ACT_OK, LEAVE_ACT_ERR,
  LEAVE_ADJUST_REQ, LEAVE_ADJUST_OK, LEAVE_ADJUST_ERR,
  LEAVE_POLICY_DRAFT_REQ, LEAVE_POLICY_DRAFT_OK, LEAVE_POLICY_DRAFT_ERR,
  LEAVE_POLICY_PUBLISH_REQ, LEAVE_POLICY_PUBLISH_OK, LEAVE_POLICY_PUBLISH_ERR,
} from "../actions/leaveActions";

const initial = {
  // data
  policies: [],
  permissions: [],
  balances: {},
  myRequests: [],
  approvals: [],

  // loaders & errors per domain
  loading: {
    policies: false,
    permissions: false,
    balances: false,
    myRequests: false,
    submit: false,
    cancel: false,
    approvals: false,
    act: false,
    adjust: false,
    policyDraft: false,
    policyPublish: false,
  },
  error: {
    policies: null,
    permissions: null,
    balances: null,
    myRequests: null,
    submit: null,
    cancel: null,
    approvals: null,
    act: null,
    adjust: null,
    policyDraft: null,
    policyPublish: null,
  },
  lastActionMeta: null,
};

const slice = createSlice({
  name: "leave",
  initialState: initial,
  reducers: {
    resetLeaveState: () => initial,
  },
  extraReducers: (builder) => {
    builder
      // Policies
      .addCase(LEAVE_POLICIES_REQ, (s)=>{ s.loading.policies = true; s.error.policies = null; })
      .addCase(LEAVE_POLICIES_OK,  (s,a)=>{ s.loading.policies = false; s.policies = a.payload; })
      .addCase(LEAVE_POLICIES_ERR, (s,a)=>{ s.loading.policies = false; s.error.policies = a.error; })

      // Permissions
      .addCase(LEAVE_PERMS_REQ, (s)=>{ s.loading.permissions = true; s.error.permissions = null; })
      .addCase(LEAVE_PERMS_OK,  (s,a)=>{ s.loading.permissions = false; s.permissions = a.payload; })
      .addCase(LEAVE_PERMS_ERR, (s,a)=>{ s.loading.permissions = false; s.error.permissions = a.error; })

      // Balances
      .addCase(LEAVE_BAL_REQ, (s)=>{ s.loading.balances = true; s.error.balances = null; })
      .addCase(LEAVE_BAL_OK,  (s,a)=>{ s.loading.balances = false; s.balances = a.payload; })
      .addCase(LEAVE_BAL_ERR, (s,a)=>{ s.loading.balances = false; s.error.balances = a.error; })

      // My Requests
      .addCase(LEAVE_MY_REQ_REQ, (s)=>{ s.loading.myRequests = true; s.error.myRequests = null; })
      .addCase(LEAVE_MY_REQ_OK,  (s,a)=>{ s.loading.myRequests = false; s.myRequests = a.payload; })
      .addCase(LEAVE_MY_REQ_ERR, (s,a)=>{ s.loading.myRequests = false; s.error.myRequests = a.error; })

      // Submit
      .addCase(LEAVE_SUBMIT_REQ, (s)=>{ s.loading.submit = true; s.error.submit = null; })
      .addCase(LEAVE_SUBMIT_OK,  (s,a)=>{ s.loading.submit = false; s.lastActionMeta = { type: "submit", id: a.payload?.id }; })
      .addCase(LEAVE_SUBMIT_ERR, (s,a)=>{ s.loading.submit = false; s.error.submit = a.error; })

      // Cancel
      .addCase(LEAVE_CANCEL_REQ, (s,a)=>{ s.loading.cancel = true; s.error.cancel = null; s.lastActionMeta = a.meta; })
      .addCase(LEAVE_CANCEL_OK,  (s)=>{ s.loading.cancel = false; })
      .addCase(LEAVE_CANCEL_ERR, (s,a)=>{ s.loading.cancel = false; s.error.cancel = a.error; })

      // Approvals
      .addCase(LEAVE_APPROVALS_REQ, (s)=>{ s.loading.approvals = true; s.error.approvals = null; })
      .addCase(LEAVE_APPROVALS_OK,  (s,a)=>{ s.loading.approvals = false; s.approvals = a.payload; })
      .addCase(LEAVE_APPROVALS_ERR, (s,a)=>{ s.loading.approvals = false; s.error.approvals = a.error; })

      // Act on approval
      .addCase(LEAVE_ACT_REQ, (s,a)=>{ s.loading.act = true; s.error.act = null; s.lastActionMeta = a.meta; })
      .addCase(LEAVE_ACT_OK,  (s)=>{ s.loading.act = false; })
      .addCase(LEAVE_ACT_ERR, (s,a)=>{ s.loading.act = false; s.error.act = a.error; })

      // Adjust balance
      .addCase(LEAVE_ADJUST_REQ, (s,a)=>{ s.loading.adjust = true; s.error.adjust = null; s.lastActionMeta = a.meta; })
      .addCase(LEAVE_ADJUST_OK,  (s)=>{ s.loading.adjust = false; })
      .addCase(LEAVE_ADJUST_ERR, (s,a)=>{ s.loading.adjust = false; s.error.adjust = a.error; })

      // Policy draft/publish
      .addCase(LEAVE_POLICY_DRAFT_REQ, (s)=>{ s.loading.policyDraft = true; s.error.policyDraft = null; })
      .addCase(LEAVE_POLICY_DRAFT_OK,  (s)=>{ s.loading.policyDraft = false; })
      .addCase(LEAVE_POLICY_DRAFT_ERR, (s,a)=>{ s.loading.policyDraft = false; s.error.policyDraft = a.error; })

      .addCase(LEAVE_POLICY_PUBLISH_REQ, (s)=>{ s.loading.policyPublish = true; s.error.policyPublish = null; })
      .addCase(LEAVE_POLICY_PUBLISH_OK,  (s)=>{ s.loading.policyPublish = false; })
      .addCase(LEAVE_POLICY_PUBLISH_ERR, (s,a)=>{ s.loading.policyPublish = false; s.error.policyPublish = a.error; });
  },
});

export const { resetLeaveState } = slice.actions;
export default slice.reducer;

/* ---------- Selectors ---------- */
export const selectLeavePolicies = (s) => s.leave.policies;
export const selectLeavePermissions = (s) => s.leave.permissions;
export const selectLeaveBalances = (s) => s.leave.balances;
export const selectMyLeaveRequests = (s) => s.leave.myRequests;
export const selectLeaveApprovals = (s) => s.leave.approvals;

export const selectLeaveLoading = (s) => s.leave.loading;
export const selectLeaveError = (s) => s.leave.error;
