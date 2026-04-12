import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AdminLeaveService from "../services/adminLeave.service";

/* ----------------------------- helpers ----------------------------- */

const normalizeEmployeeId = (value) =>
  String(value || "").trim().toUpperCase();

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token) => {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const extractEmployeeIdFromObject = (obj) => {
  if (!obj || typeof obj !== "object") return "";

  const candidates = [
    obj.employee_id,
    obj.employeeId,
    obj.emp_id,
    obj.empId,
    obj.employeeCode,
    obj.employee_code,
    obj.user_id,
    obj.userId,
    obj.sub,
    obj.id,
    obj.code,
  ];

  for (const value of candidates) {
    const id = normalizeEmployeeId(value);
    if (id) return id;
  }

  return "";
};

const getEmployeeIdFromLocalStorage = () => {
  const keysToCheck = [
    "user",
    "auth",
    "authUser",
    "profile",
    "employee",
    "currentUser",
  ];

  for (const key of keysToCheck) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    const parsed = safeJsonParse(raw);
    if (!parsed) continue;

    const direct = extractEmployeeIdFromObject(parsed);
    if (direct) return direct;

    if (parsed.user) {
      const nestedUser = extractEmployeeIdFromObject(parsed.user);
      if (nestedUser) return nestedUser;
    }

    if (parsed.profile) {
      const nestedProfile = extractEmployeeIdFromObject(parsed.profile);
      if (nestedProfile) return nestedProfile;
    }

    if (parsed.data) {
      const nestedData = extractEmployeeIdFromObject(parsed.data);
      if (nestedData) return nestedData;
    }
  }

  const tokenKeys = [
    "token",
    "authToken",
    "access_token",
    "accessToken",
    "jwt",
  ];

  for (const key of tokenKeys) {
    const token = localStorage.getItem(key);
    if (!token) continue;

    const payload = decodeJwtPayload(token);
    const tokenEmpId = extractEmployeeIdFromObject(payload);
    if (tokenEmpId) return tokenEmpId;
  }

  return "";
};

const resolveApproverEmployeeId = (state) => {
  const stateCandidates = [
    state.auth?.user,
    state.auth?.profile,
    state.profile,
    state.user,
    state.auth,
  ];

  for (const source of stateCandidates) {
    const id = extractEmployeeIdFromObject(source);
    if (id) return id;
  }

  const fromLocalStorage = getEmployeeIdFromLocalStorage();
  if (fromLocalStorage) return fromLocalStorage;

  return "";
};

/* ----------------------------- Thunks ----------------------------- */

export const fetchRequests = createAsyncThunk(
  "requests/fetch",
  async (params, { getState, rejectWithValue }) => {
    try {
      const stateParams = getState().requests?.params || {};
      const effectiveParams = { ...stateParams, ...(params || {}) };

      const data = await AdminLeaveService.listRequests(effectiveParams);

      return {
        data: Array.isArray(data) ? data : [],
        params: effectiveParams,
      };
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load requests");
    }
  }
);

export const decideRequest = createAsyncThunk(
  "requests/decide",
  async ({ id, action, note, approverEmployeeId }, { rejectWithValue }) => {
    try {
      const finalApproverEmployeeId = normalizeEmployeeId(approverEmployeeId);

      console.log("Final approverEmployeeId:", finalApproverEmployeeId);

      if (!finalApproverEmployeeId) {
        return rejectWithValue("Approver employee ID is missing");
      }

      if (!approverEmployeeId) {
        return rejectWithValue(
          "Approver employee ID not found in login state or localStorage. Map the correct employee_id from auth."
        );
      }

      const res = await AdminLeaveService.decideRequest(
        id,
        action,
        note,
        finalApproverEmployeeId
      );

      return {
        id: res?.id ?? id,
        status: action === "approve" ? "Approved" : "Rejected",
        note: res?.note ?? note ?? "",
      };
    } catch (err) {
      console.error("decideRequest error:", err);
      return rejectWithValue(err?.message || "Failed to update request");
    }
  }
);

/* ------------------------------ Slice ----------------------------- */

const initialState = {
  items: [],
  params: {
    q: "",
    type: "All",
    status: "Pending",
  },
  loading: false,
  error: null,
};

const requestsSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    setParams(state, action) {
      state.params = { ...state.params, ...action.payload };
    },
    clearRequests(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        state.params = {
          ...state.params,
          ...(action.payload?.params || {}),
        };
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load requests";
      })

      .addCase(decideRequest.pending, (state) => {
        state.error = null;
      })
      .addCase(decideRequest.fulfilled, (state, action) => {
        const { id, status, note } = action.payload || {};
        const row = state.items.find((r) => String(r.id) === String(id));
        if (row) {
          row.status = status;
          row.note = note;
        }
      })
      .addCase(decideRequest.rejected, (state, action) => {
        state.error = action.payload || "Failed to update request";
      });
  },
});

export const { setParams, clearRequests } = requestsSlice.actions;
export default requestsSlice.reducer;