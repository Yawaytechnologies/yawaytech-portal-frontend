// src/redux/actions/leaveActions.js
import { leaveService } from "../services/leaveService";

/* ---------- Action Type Constants ---------- */
export const LEAVE_POLICIES_REQ = "leave/POLICIES_REQ";
export const LEAVE_POLICIES_OK  = "leave/POLICIES_OK";
export const LEAVE_POLICIES_ERR = "leave/POLICIES_ERR";

export const LEAVE_PERMS_REQ = "leave/PERMS_REQ";
export const LEAVE_PERMS_OK  = "leave/PERMS_OK";
export const LEAVE_PERMS_ERR = "leave/PERMS_ERR";

export const LEAVE_BAL_REQ = "leave/BAL_REQ";
export const LEAVE_BAL_OK  = "leave/BAL_OK";
export const LEAVE_BAL_ERR = "leave/BAL_ERR";

export const LEAVE_MY_REQ_REQ = "leave/MY_REQ_REQ";
export const LEAVE_MY_REQ_OK  = "leave/MY_REQ_OK";
export const LEAVE_MY_REQ_ERR = "leave/MY_REQ_ERR";

export const LEAVE_SUBMIT_REQ = "leave/SUBMIT_REQ";
export const LEAVE_SUBMIT_OK  = "leave/SUBMIT_OK";
export const LEAVE_SUBMIT_ERR = "leave/SUBMIT_ERR";

export const LEAVE_CANCEL_REQ = "leave/CANCEL_REQ";
export const LEAVE_CANCEL_OK  = "leave/CANCEL_OK";
export const LEAVE_CANCEL_ERR = "leave/CANCEL_ERR";

export const LEAVE_APPROVALS_REQ = "leave/APPROVALS_REQ";
export const LEAVE_APPROVALS_OK  = "leave/APPROVALS_OK";
export const LEAVE_APPROVALS_ERR = "leave/APPROVALS_ERR";

export const LEAVE_ACT_REQ = "leave/ACT_REQ";
export const LEAVE_ACT_OK  = "leave/ACT_OK";
export const LEAVE_ACT_ERR = "leave/ACT_ERR";

export const LEAVE_ADJUST_REQ = "leave/ADJUST_REQ";
export const LEAVE_ADJUST_OK  = "leave/ADJUST_OK";
export const LEAVE_ADJUST_ERR = "leave/ADJUST_ERR";

export const LEAVE_POLICY_DRAFT_REQ = "leave/POLICY_DRAFT_REQ";
export const LEAVE_POLICY_DRAFT_OK  = "leave/POLICY_DRAFT_OK";
export const LEAVE_POLICY_DRAFT_ERR = "leave/POLICY_DRAFT_ERR";

export const LEAVE_POLICY_PUBLISH_REQ = "leave/POLICY_PUBLISH_REQ";
export const LEAVE_POLICY_PUBLISH_OK  = "leave/POLICY_PUBLISH_OK";
export const LEAVE_POLICY_PUBLISH_ERR = "leave/POLICY_PUBLISH_ERR";

/* ---------- Thunks ---------- */
export const fetchLeavePolicies = () => async (dispatch) => {
  dispatch({ type: LEAVE_POLICIES_REQ });
  try {
    const data = await leaveService.listPolicies();
    dispatch({ type: LEAVE_POLICIES_OK, payload: data });
  } catch (err) {
    dispatch({ type: LEAVE_POLICIES_ERR, error: err.message });
  }
};

export const fetchLeavePermissions = () => async (dispatch) => {
  dispatch({ type: LEAVE_PERMS_REQ });
  try {
    const data = await leaveService.listPermissions();
    dispatch({ type: LEAVE_PERMS_OK, payload: data });
  } catch (err) {
    dispatch({ type: LEAVE_PERMS_ERR, error: err.message });
  }
};

export const fetchLeaveBalances = () => async (dispatch) => {
  dispatch({ type: LEAVE_BAL_REQ });
  try {
    const data = await leaveService.listBalances();
    dispatch({ type: LEAVE_BAL_OK, payload: data });
  } catch (err) {
    dispatch({ type: LEAVE_BAL_ERR, error: err.message });
  }
};

export const fetchMyLeaveRequests = () => async (dispatch) => {
  dispatch({ type: LEAVE_MY_REQ_REQ });
  try {
    const data = await leaveService.listMyRequests();
    dispatch({ type: LEAVE_MY_REQ_OK, payload: data });
  } catch (err) {
    dispatch({ type: LEAVE_MY_REQ_ERR, error: err.message });
  }
};

export const submitLeaveRequest = (payload) => async (dispatch) => {
  dispatch({ type: LEAVE_SUBMIT_REQ });
  try {
    const data = await leaveService.createAndSubmit(payload);
    dispatch({ type: LEAVE_SUBMIT_OK, payload: data });
    // refresh both lists
    dispatch(fetchMyLeaveRequests());
    dispatch(fetchApprovalsQueue());
  } catch (err) {
    dispatch({ type: LEAVE_SUBMIT_ERR, error: err.message });
  }
};

export const cancelLeaveRequest = (id) => async (dispatch) => {
  dispatch({ type: LEAVE_CANCEL_REQ, meta: { id } });
  try {
    const data = await leaveService.cancelRequest(id);
    dispatch({ type: LEAVE_CANCEL_OK, payload: data, meta: { id } });
    dispatch(fetchMyLeaveRequests());
  } catch (err) {
    dispatch({ type: LEAVE_CANCEL_ERR, error: err.message, meta: { id } });
  }
};

export const fetchApprovalsQueue = () => async (dispatch) => {
  dispatch({ type: LEAVE_APPROVALS_REQ });
  try {
    const data = await leaveService.adminListApprovals();
    dispatch({ type: LEAVE_APPROVALS_OK, payload: data });
  } catch (err) {
    dispatch({ type: LEAVE_APPROVALS_ERR, error: err.message });
  }
};

export const actOnApproval = ({ id, action, note }) => async (dispatch) => {
  dispatch({ type: LEAVE_ACT_REQ, meta: { id, action } });
  try {
    const data = await leaveService.adminActOnApproval(id, action, note);
    dispatch({ type: LEAVE_ACT_OK, payload: data, meta: { id, action } });
    // refresh both lists
    dispatch(fetchApprovalsQueue());
    dispatch(fetchMyLeaveRequests());
  } catch (err) {
    dispatch({ type: LEAVE_ACT_ERR, error: err.message, meta: { id, action } });
  }
};

export const adjustLeaveBalance = ({ policyCode, delta, reason }) => async (dispatch) => {
  dispatch({ type: LEAVE_ADJUST_REQ, meta: { policyCode } });
  try {
    const res = await leaveService.adminAdjustBalance({ policyCode, delta, reason });
    dispatch({ type: LEAVE_ADJUST_OK, payload: res, meta: { policyCode } });
    dispatch(fetchLeaveBalances());
  } catch (err) {
    dispatch({ type: LEAVE_ADJUST_ERR, error: err.message, meta: { policyCode } });
  }
};

export const createPolicyDraft = (payload) => async (dispatch) => {
  dispatch({ type: LEAVE_POLICY_DRAFT_REQ });
  try {
    const res = await leaveService.createPolicyDraft(payload);
    dispatch({ type: LEAVE_POLICY_DRAFT_OK, payload: res });
    dispatch(fetchLeavePolicies());
  } catch (err) {
    dispatch({ type: LEAVE_POLICY_DRAFT_ERR, error: err.message });
  }
};

export const publishPolicy = (id) => async (dispatch) => {
  dispatch({ type: LEAVE_POLICY_PUBLISH_REQ, meta: { id } });
  try {
    const res = await leaveService.publishPolicy(id);
    dispatch({ type: LEAVE_POLICY_PUBLISH_OK, payload: res, meta: { id } });
    dispatch(fetchLeavePolicies());
  } catch (err) {
    dispatch({ type: LEAVE_POLICY_PUBLISH_ERR, error: err.message, meta: { id } });
  }
};
