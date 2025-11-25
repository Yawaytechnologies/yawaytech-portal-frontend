// src/redux/services/adminLeave.service.js
const sleep = (ms = 300) => new Promise((r) => setTimeout(r, ms));

/* --------------------- Base URL (env or hard-coded) --------------------- */

const rawBase =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  "https://yawaytech-portal-backend-python-2.onrender.com";

const API_BASE = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

/* ---------------------- Workweek helpers ---------------------- */

const DEFAULT_WORKWEEK_REGION = "IN-TN";

const adaptWorkweekFromApi = (r = {}) => {
  const policy = r.policy || {};

  const weeklyOff = [];
  const pushIfOff = (key, code) => {
    // backend: true = working, false = off
    if (policy[key] === false) weeklyOff.push(code);
  };

  pushIfOff("mon", "MON");
  pushIfOff("tue", "TUE");
  pushIfOff("wed", "WED");
  pushIfOff("thu", "THU");
  pushIfOff("fri", "FRI");
  pushIfOff("sun", "SUN");

  let altSaturday = "NONE";
  let customOffDays = [];

  if (typeof policy.sat === "string") {
    const sat = policy.sat.toLowerCase();
    if (sat === "2nd,4th" || sat === "second,fourth") {
      altSaturday = "SECOND_FOURTH";
    } else if (sat === "1st,3rd" || sat === "first,third") {
      altSaturday = "FIRST_THIRD";
    } else {
      altSaturday = "CUSTOM";
      // if backend ever returns explicit custom days, map them here
      customOffDays = r.custom_off_days || [];
    }
  } else if (policy.sat === false) {
    // all Saturdays off
    weeklyOff.push("SAT");
  }

  return {
    region: r.region || DEFAULT_WORKWEEK_REGION,
    weeklyOff,
    altSaturday,
    customOffDays,
    effectiveFrom: r.effective_from || "",
    status: (r.status || "DRAFT").toString().toLowerCase(),
  };
};

const adaptWorkweekToApi = (cfg) => {
  const weeklyOff = cfg.weeklyOff || [];
  const isOff = (code) => weeklyOff.includes(code);

  const policy = {
    // backend expects "true = working", "false = off"
    mon: !isOff("MON"),
    tue: !isOff("TUE"),
    wed: !isOff("WED"),
    thu: !isOff("THU"),
    fri: !isOff("FRI"),
    sun: !isOff("SUN"),
  };

  // Saturday rule
  if (cfg.altSaturday === "SECOND_FOURTH") {
    policy.sat = "2nd,4th";      // 👈 exactly like your curl example
  } else if (cfg.altSaturday === "FIRST_THIRD") {
    policy.sat = "1st,3rd";
  } else if (cfg.altSaturday === "CUSTOM") {
    policy.sat = "custom";       // or whatever your backend expects
  } else {
    // no alternate rule: either fully off or fully working
    policy.sat = isOff("SAT") ? false : true;
  }

  return {
    region: cfg.region || DEFAULT_WORKWEEK_REGION,
    policy,
  };
};


/* --------------------------- Dummy data rows ---------------------------- */

const dummyRows = [
  {
    id: "REQ-1001",
    employee_id: "YTP000123",
    employee_name: "Anitha",
    leave_type_code: "EL",
    start_date: "2025-11-15",
    end_date: "2025-11-18",
    requested_days: 4,
    requested_unit: "DAY",
    requested_hours: 0,
    status: "PENDING",
    reason: "Family function",
  },
  {
    id: "REQ-1002",
    employee_id: "YTP000201",
    employee_name: "Rahul",
    leave_type_code: "CL",
    start_date: "2025-11-12",
    end_date: "2025-11-12",
    requested_days: 1,
    requested_unit: "DAY",
    requested_hours: 0,
    status: "PENDING",
    reason: "Bank work",
  },
  {
    id: "REQ-1003",
    employee_id: "YTP000301",
    employee_name: "Meera",
    leave_type_code: "SL",
    start_date: "2025-11-10",
    end_date: "2025-11-11",
    requested_days: 2,
    requested_unit: "DAY",
    requested_hours: 0,
    status: "APPROVED",
    reason: "Fever",
  },
];

function applyDummyFilters(rows, params = {}) {
  let out = rows;

  if (params.status && params.status !== "All") {
    // UI uses "Pending"/"Approved"/"Rejected"
    const wanted = params.status;
    out = out.filter((r) => {
      const uiStatus = apiStatusToUi(r.status);
      return uiStatus === wanted;
    });
  }

  if (params.type && params.type !== "All") {
    // match either old dummy 'type' or real API 'leave_type_code'
    out = out.filter(
      (r) =>
        r.type === params.type ||
        r.leave_type_code === params.type
    );
  }

  if (params.q) {
    const q = params.q.toLowerCase();
    out = out.filter((r) => {
      const combo =
        (r.employeeName || r.employee_name || "") +
        (r.employeeId || r.employee_id || "") +
        (r.id != null ? String(r.id) : "");
      return combo.toLowerCase().includes(q);
    });
  }

  return out;
}

const statusToApi = (uiStatus) => {
  if (!uiStatus || uiStatus === "Pending") return "PENDING";
  if (uiStatus === "Approved") return "APPROVED";
  if (uiStatus === "Rejected") return "REJECTED";
  if (uiStatus === "All") return null;
  return uiStatus.toUpperCase();
};

const apiStatusToUi = (s) => {
  if (!s) return "";
  const up = s.toString().toUpperCase();
  if (up === "PENDING") return "Pending";
  if (up === "APPROVED") return "Approved";
  if (up === "REJECTED") return "Rejected";
  return s;
};

// decision MUST be "APPROVED" or "REJECTED"
const actionToDecision = (action) => {
  if (!action) return "";
  const a = action.toLowerCase();
  if (a === "approve") return "APPROVED";
  if (a === "reject") return "REJECTED";
  return action.toUpperCase();
};

/* Small helper: compute `days` + `half` for UI from API fields */
const mapRequestRowForUi = (r) => {
  const unit = r.requested_unit;
  const days = r.requested_days;
  const hours = r.requested_hours;

  let half = "";
  if (unit === "DAY" && days === 0.5) {
    half = "Half";
  } else if (unit === "HOUR") {
    half = `${hours ?? 0}h`;
  }

  return {
    ...r,
    days: days ?? r.days ?? null,
    half,
    status: apiStatusToUi(r.status),
  };
};

/* -------------------------- Leave Requests API -------------------------- */

const AdminLeaveService = {
  /**
   * GET /api/admin/leave/requests?status=PENDING
   */
  async listRequests(params = {}) {
    const apiStatus = statusToApi(params.status || "Pending");

    let url = `${API_BASE}/api/admin/leave/requests`;
    if (apiStatus) {
      const qs = new URLSearchParams();
      qs.set("status", apiStatus);
      url += `?${qs.toString()}`;
    }

    try {
      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }

      const data = await res.json();

      const normalized = (Array.isArray(data) ? data : [])
        .map(mapRequestRowForUi);

      return applyDummyFilters(normalized, params);
    } catch (err) {
      console.error("listRequests API failed, using dummy data:", err);
      await sleep();
      const fallback = dummyRows.map(mapRequestRowForUi);
      return applyDummyFilters(fallback, params);
    }
  },

  /**
   * POST /api/admin/leave/requests/{req_id}/decision
   *
   * {
   *   "decision": "APPROVED" | "REJECTED",
   *   "approver_employee_id": "YTPL001HR",
   *   "admin_note": "optional"
   * }
   */
  async decideRequest(id, action, note, approverEmployeeId) {
    const decision = actionToDecision(action); // -> "APPROVED" / "REJECTED"

    const payload = {
      decision,
      approver_employee_id: approverEmployeeId,
      admin_note: note || null,
    };

    const url = `${API_BASE}/api/admin/leave/requests/${id}/decision`;

    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let detail = "";
        try {
          detail = await res.text();
        } catch (_) {}
        console.error("Decision API error raw response:", detail);
        throw new Error(`HTTP ${res.status} ${res.statusText} ${detail}`);
      }

      const data = await res.json().catch(() => ({}));

      // Use backend row if returned, otherwise just status/note
      const backendStatus = data.status || data.decision || decision;
      const uiStatus =
        apiStatusToUi(backendStatus) ||
        (action === "approve" ? "Approved" : "Rejected");

      return {
        id: data.id ?? id,
        status: uiStatus,
        note: data.admin_note ?? data.note ?? note ?? "",
        _fallback: false,
      };
    } catch (err) {
      console.error("decideRequest API failed, mocking result:", err);
      await sleep(200);
      return {
        id,
        status: action === "approve" ? "Approved" : "Rejected",
        note: note || "",
        _fallback: true,
      };
    }
  },

  /* ------------------------- Leave Policies API ------------------------- */

  /**
   * GET /api/admin/leave/types
   */
async listPolicies() {
  const url = `${API_BASE}/api/admin/leave/types`;

  const adaptFromApi = (r) => ({
    id: r.id ?? null,
    code: r.code,
    name: r.name,
    unit: r.unit, // "DAY" | "HOUR"
    isPaid: r.is_paid,
    allowHalfDay: r.allow_half_day,
    allowPermissionHours: r.allow_permission_hours,
    durationDays: r.duration_days,
    monthlyLimit: r.monthly_limit,
    yearlyLimit: r.yearly_limit,
    carryForwardAllowed: r.carry_forward_allowed,
  });

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(adaptFromApi);
},


  /**
   * POST  /api/admin/leave/types          (create)
   * PATCH /api/admin/leave/types/{code}   (update)
   *
   * Frontend uses:
   *   yearlyQuota, monthlyQuota, halfDay, carryForward, maxCarry, negativeBalance, status ("draft"/"published")
   * Backend likely expects:
   *   yearly_quota, monthly_quota, half_day, carry_forward, max_carry, negative_balance, status ("DRAFT"/"PUBLISHED")
   */
  async upsertPolicy(policy) {
  const isUpdate = policy.id != null;

  const adaptToApi = (p) => ({
    code: p.code,
    name: p.name,
    unit: p.unit,
    is_paid: p.isPaid,
    allow_half_day: p.allowHalfDay,
    allow_permission_hours: p.allowPermissionHours,
    duration_days: p.durationDays,
    monthly_limit: p.monthlyLimit,
    yearly_limit: p.yearlyLimit,
    carry_forward_allowed: p.carryForwardAllowed,
  });

  const payload = adaptToApi(policy);

  const url = isUpdate
    ? `${API_BASE}/api/admin/leave/types/${encodeURIComponent(policy.code)}`
    : `${API_BASE}/api/admin/leave/types`;

  const method = isUpdate ? "PATCH" : "POST";

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("upsertPolicy error raw:", text);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }

  const data = await res.json();
  return adaptFromApi(data); // reuse same adapter
},



  async deletePolicy(code) {
    if (!code) {
      throw new Error("deletePolicy: code is required");
    }

    const url = `${API_BASE}/api/admin/leave/types/${encodeURIComponent(
      code
    )}`;

    try {
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "ARCHIVED", // or whatever your backend expects
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("deletePolicy (archive) error raw:", text);
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }

      return true;
    } catch (err) {
      console.error("deletePolicy API failed:", err);
      throw err;
    }
  },

  /**
   * POST /api/admin/leave/types/publish
   */
  async publishPolicies() {
    const url = `${API_BASE}/api/admin/leave/types/publish`;

    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("publishPolicies error raw:", text);
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }

      const data = await res.json().catch(() => ({}));
      const publishedAtRaw =
        data.published_at || data.publishedAt || new Date().toISOString();

      return {
        publishedAt: new Date(publishedAtRaw).toISOString(),
      };
    } catch (err) {
      console.error("publishPolicies API failed:", err);
      return {
        publishedAt: new Date().toISOString(),
        _fallback: true,
      };
    }
  },

  /* ---------------------------- Holidays API ---------------------------- */
  // These functions are used by HolidaysPanel + leaveholidaysSlice

  // Normalize API → UI
  _adaptHolidayFromApi(r, fallbackYear) {
    const year =
      r.year ??
      (typeof r.date === "string" && r.date.length >= 4
        ? Number(r.date.slice(0, 4))
        : fallbackYear ?? null);

    return {
      id: r.id,
      date: r.holiday_date, // ISO yyyy-mm-dd (for <input type="date" />)
      name: r.name,
      scope: (r.scope || "public").toString().toLowerCase(), // "public" | "company" | "regional"
      year,
       is_paid: r.is_paid,
    recurs_annually: r.recurs_annually,
    region: r.region ?? null,  // 
    };
  },

  /**
   * GET /api/admin/leave/holidays?start=2025-01-01&end=2025-12-31
   */
  async listHolidays(year) {
    const y = Number(year) || new Date().getFullYear();
    const start = `${y}-01-01`;
    const end = `${y}-12-31`;

    const qs = new URLSearchParams();
    qs.set("start", start);
    qs.set("end", end);

    const url = `${API_BASE}/api/admin/leave/holidays?${qs.toString()}`;

    try {
      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("listHolidays error raw:", text);
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }

      const data = await res.json();
      const rows = (Array.isArray(data) ? data : []).map((r) =>
        this._adaptHolidayFromApi(r, y)
      );

      return rows;
    } catch (err) {
      console.error("listHolidays API failed:", err);
      return [];
    }
  },

  /**
   * POST  /api/admin/leave/holidays          (create)
   * PATCH /api/admin/leave/holidays/{id}     (update)
   */
  async upsertHoliday(h) {
    const isUpdate = h.id != null;

    // Normalise date → holiday_date in YYYY-MM-DD
    const holiday_date = h.holiday_date || h.date || null;

    if (!holiday_date) {
      throw new Error(
        "holiday_date is required before calling upsertHoliday"
      );
    }

    const payload = {
      // 👇 must match backend schema
      holiday_date, // "2025-11-19"
      name: (h.name || "").trim(), // string
      is_paid:
        h.is_paid === true ||
        h.is_paid === "true" ||
        h.is_paid === 1 ||
        h.is_paid === "1", // boolean
      region: h.region ?? "", // string (or null if your backend prefers)
      recurs_annually:
        h.recurs_annually === true ||
        h.recurs_annually === "true" ||
        h.recurs_annually === 1 ||
        h.recurs_annually === "1", // boolean
       
    };

    const url = isUpdate
      ? `${API_BASE}/api/admin/leave/holidays/${encodeURIComponent(h.id)}`
      : `${API_BASE}/api/admin/leave/holidays`;

    const method = isUpdate ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("upsertHoliday error raw:", text);
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }

      const data = await res.json();
      return this._adaptHolidayFromApi
        ? this._adaptHolidayFromApi(data)
        : data;
    } catch (err) {
      console.error("upsertHoliday API failed:", err);
      throw err;
    }
  },

  /**
   * DELETE /api/admin/leave/holidays/{id}
   */
  async deleteHoliday(id) {
    const url = `${API_BASE}/api/admin/leave/holidays/${encodeURIComponent(
      id
    )}`;

    try {
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("deleteHoliday error raw:", text);
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }

      return true;
    } catch (err) {
      console.error("deleteHoliday API failed:", err);
      throw err;
    }
  },

  /**
   * POST /api/admin/leave/holidays/import
   *
   * Body:
   *   { holidays: [{ date, name, scope }, ...] }
   *
   * Returns: array of created holidays.
   */
  async importHolidays(list) {
    const url = `${API_BASE}/api/admin/leave/holidays/import`;

    const holidays = (Array.isArray(list) ? list : []).map((h) => ({
      date: h.holiday_date,
      name: h.name,
      scope: (h.scope || "public").toString().toUpperCase(),
    }));

    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ holidays }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("importHolidays error raw:", text);
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }

      const data = await res.json();
      const rows = (Array.isArray(data) ? data : []).map((r) =>
        this._adaptHolidayFromApi(r)
      );
      return rows;
    } catch (err) {
      console.error("importHolidays API failed:", err);
      throw err;
    }
  },

  /**
   * POST /api/admin/leave/holidays/publish
   *
   * Body:
   *   { year: 2025 }
   *
   * Returns:
   *   { published_at: "iso-date" }
   */
  async publishHolidays(year) {
    const url = `${API_BASE}/api/admin/leave/holidays/publish`;

    const payload = { year: Number(year) || new Date().getFullYear() };

    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("publishHolidays error raw:", text);
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }

      const data = await res.json().catch(() => ({}));
      const publishedAtRaw =
        data.published_at || data.publishedAt || new Date().toISOString();

      return {
        publishedAt: new Date(publishedAtRaw).toISOString(),
      };
    } catch (err) {
      console.error("publishHolidays API failed:", err);
      return {
        publishedAt: new Date().toISOString(),
        _fallback: true,
      };
    }
  },

    /* --------------------------- Workweek API --------------------------- */

  // GET /api/workweek   (assuming backend returns the current rules)
  async fetchWorkweek() {
    const url = `${API_BASE}/api/workweek`;

    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("fetchWorkweek error:", text);
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    }

    const data = await res.json().catch(() => ({}));
    return adaptWorkweekFromApi(data);
  },

  // POST /api/workweek   Create/Update workweek rules
  async saveWorkweek(cfg) {
    const payload = adaptWorkweekToApi(cfg);
    const url = `${API_BASE}/api/workweek`;

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("saveWorkweek error:", text);
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    }

    const data = await res.json().catch(() => ({}));
    return adaptWorkweekFromApi(data);
  },

  // If you have a publish endpoint, wire it. If not, this still lets the UI work.
  async publishWorkweek() {
    const url = `${API_BASE}/api/workweek/publish`;

    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: DEFAULT_WORKWEEK_REGION }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("publishWorkweek error raw:", text);
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }

      const data = await res.json().catch(() => ({}));
      const publishedAtRaw =
        data.published_at || data.publishedAt || new Date().toISOString();

      return { publishedAt: new Date(publishedAtRaw).toISOString() };
    } catch (err) {
      console.error("publishWorkweek API failed, using fallback:", err);
      return {
        publishedAt: new Date().toISOString(),
        _fallback: true,
      };
    }
  },

};

export default AdminLeaveService;
