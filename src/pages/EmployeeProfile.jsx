// src/pages/EmployeeProfile.jsx
import React, { useMemo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation } from "react-router-dom";
import { FiCopy } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  MdEmail,
  MdPhone,
  MdBadge,
  MdCalendarToday,
  MdHome,
} from "react-icons/md";

import { fetchEmployeeById } from "../redux/actions/employeeProfileActions";
import {
  resetEmployee,
  selectEmployee,
  selectEmployeeLoading,
  selectEmployeeError,
} from "../redux/reducer/employeeProfileSlice";

/* ---------- THEME (single source of truth) ---------- */
const ACCENT = "#005BAC"; // brand blue

/* ---------------------- BANK + SALARY (EMPLOYEE SIDE) ---------------------- */
// ✅ API base
const API_BASE = (
  import.meta?.env?.VITE_API_BASE_URL ||
  import.meta?.env?.VITE_API_BASE ||
  import.meta?.env?.VITE_API_URL ||
  "https://yawaytech-portal-backend-python-2.onrender.com"
).replace(/\/$/, "");

// ✅ CHANGE ONLY THESE TWO IF YOUR BACKEND ROUTES DIFFER
const BANK_URL = (employeeId) =>
  `${API_BASE}/bank-details/${encodeURIComponent(employeeId)}`;

const getAuthToken = (reduxToken) =>
  reduxToken ||
  localStorage.getItem("auth_token") ||
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  "";

const fetchJSON = async (url, reduxToken) => {
  const token = getAuthToken(reduxToken);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Request failed: HTTP ${res.status}`);
  }

  const data = await res.json().catch(() => ({}));
  return data;
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(String(text ?? ""));
    toast.success("Copied", {
      position: "top-center",
      autoClose: 1300,
      hideProgressBar: true,
    });
  } catch {
    toast.error("Copy failed", {
      position: "top-center",
      autoClose: 1300,
      hideProgressBar: true,
    });
  }
};

/* ------------------------------- UTILS ------------------------------------ */
const fmtDate = (v) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return v;
  }
};

const b64urlToJSON = (b64url) => {
  try {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const extractIdsFromJWT = (token) => {
  if (!token || typeof token !== "string" || token.split(".").length < 2)
    return {};
  const [, payload] = token.split(".");
  const data = b64urlToJSON(payload) || {};
  return {
    numericId:
      data.id ?? data.user_id ?? (data.employee && data.employee.id) ?? null,
    code:
      data.employee_id ??
      data.employeeId ??
      (data.employee && data.employee.employee_id) ??
      null,
  };
};

const getNumericIdFromUser = (u) =>
  u?.id != null ? u.id : u?.employee?.id != null ? u.employee.id : null;
const getCodeFromUser = (u) =>
  u?.employee_id ?? u?.employeeId ?? u?.employee?.employee_id ?? null;

/* ------------------------------- SHARED ATOMS ----------------------------- */
const val = (v, fallback = "—") =>
  v === null || v === undefined || `${v}`.trim() === "" ? fallback : v;

/** Turn API value into a valid <img src> */
const asImgSrc = (val) => {
  if (!val) return "";
  const v = String(val).trim();

  // already a URL or a data-URL
  if (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("data:image/")
  ) {
    return v;
  }

  // likely raw base64 (jpeg/png). If your backend stores PNGs, change to image/png.
  const looksBase64 = /^[A-Za-z0-9+/=_-]{100,}$/.test(v);
  if (looksBase64) return `data:image/jpeg;base64,${v}`;

  return "";
};

function DetailRow({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <span className="text-xs sm:text-sm text-slate-500 shrink-0 font-medium">
          {label}
        </span>
        <span
          className="text-xs sm:text-sm font-semibold text-[#0e1b34] text-right min-w-0 break-words whitespace-normal"
          title={String(value ?? "")}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

const CopyPill = ({ value = "Copy" }) => {
  if (!value || value === "—") return null;

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      toast.success("Copied to clipboard", {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: true,
      });
    } catch {
      toast.error("Copy failed", {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: true,
      });
    }
  };

  return (
    <button
      onClick={doCopy}
      type="button"
      className="
        inline-flex items-center gap-1
        rounded-full
        bg-[#005BAC]/10 text-[#005BAC]
        px-3 py-1.5
        text-[11px] sm:text-xs
        hover:bg-[#005BAC]/20
        transition
      "
    >
      <FiCopy className="text-sm" />
      Copy
    </button>
  );
};

/* ------------------------------- SKELETON --------------------------------- */
const Skeleton = () => (
  <div className="bg-[#F1F5F9] min-h-screen caret-transparent">
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-4 lg:px-6 py-4">
      <div
        className="w-full bg-white rounded-xl shadow-lg border-t-4 overflow-hidden p-4 sm:p-6"
        style={{ borderColor: ACCENT }}
      >
        <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
          <div className="w-32 h-32 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-56 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-5 w-full bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg border" />
          ))}
          <div className="col-span-1 md:col-span-2 h-16 bg-gray-50 rounded-md border" />
        </div>
        <div className="mt-6 h-24 bg-gray-50 rounded-md border" />
      </div>
    </div>
  </div>
);

/* ------------------------------- PAGE ------------------------------------- */
export default function EmployeeProfilePage() {
  const params = useParams();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user, token } = useSelector((s) => s.auth || {});
  const loading = useSelector(selectEmployeeLoading);
  const error = useSelector(selectEmployeeError);
  const employee = useSelector(selectEmployee);

  // ✅ NEW: popup states
  const [bankOpen, setBankOpen] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState(null);
  const [salaryInfo, setSalaryInfo] = useState(null);

  const identifier = useMemo(() => {
    const fromParams =
      params.identifier ?? params.employeeId ?? params.id_ ?? params.id;
    const fromState = location?.state?.identifier;
    const authNumeric = getNumericIdFromUser(user);
    const authCode = getCodeFromUser(user);

    let lsNumeric = null,
      lsCode = null;
    try {
      const raw = localStorage.getItem("auth") || localStorage.getItem("user");
      if (raw) {
        const o = JSON.parse(raw);
        const u = o?.user || o;
        lsNumeric = getNumericIdFromUser(u);
        lsCode = getCodeFromUser(u);
      }
    } catch (err) {
      void err;
    }

    const { numericId: jwtNumeric, code: jwtCode } =
      extractIdsFromJWT(token) ||
      extractIdsFromJWT(localStorage.getItem("token")) ||
      {};

    const chosen =
      fromParams ??
      fromState ??
      (authNumeric != null ? String(authNumeric) : null) ??
      (jwtNumeric != null ? String(jwtNumeric) : null) ??
      (lsNumeric != null ? String(lsNumeric) : null) ??
      authCode ??
      jwtCode ??
      lsCode ??
      "";

    return (chosen ?? "").toString().trim();
  }, [params, location?.state, user, token]);

  useEffect(() => {
    dispatch(resetEmployee());
    if (!identifier) return;
    dispatch(fetchEmployeeById(identifier));
  }, [identifier, dispatch]);

  if (!identifier) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-yellow-50 p-5 text-yellow-800">
          Couldn’t determine an employee identifier from the URL/session.
          <br />
          Employees: open <code>/employee/profile</code>. Admins: open{" "}
          <code>/employees/&lt;id-or-code&gt;</code>.
        </div>
      </div>
    );
  }

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          Failed to load employee: {error}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-yellow-50 p-5 text-yellow-800">
          No data returned for the employee profile.
        </div>
      </div>
    );
  }

  /* ------------------------------- MAPPING -------------------------------- */
  const {
    id: emp_id,
    name,
    father_name,
    date_of_birth,
    employee_id,
    date_of_joining,
    date_of_leaving,
    email,
    mobile_number,
    marital_status,
    permanent_address,
    designation,
    department,
    profile_picture,
    pan,
    aadhar,
    guardian_name,
    guardian_phone,
    blood_group,
  } = employee;

  // ✅ build avatar from backend fields only (no dummy URL)
  const rawAvatar =
    profile_picture ||
    employee?.employee_picture ||
    employee?.profile ||
    employee?.photo ||
    employee?.avatar ||
    "";

  const avatarSrc = asImgSrc(rawAvatar);

  const M = {
    id: val(employee_id || emp_id),
    name: val(name),
    avatar: avatarSrc,
    hasAvatar: !!avatarSrc,
    title: val(designation || "Software Engineer"),
    email: val(email),
    phone: val(mobile_number),
    doj: val(fmtDate(date_of_joining)),
    dol: val(fmtDate(date_of_leaving)),
    pan: val(pan),
    aadhar: val(aadhar),
    dob: val(fmtDate(date_of_birth)),
    maritalStatus: val(marital_status),
    guardianName: val(guardian_name || father_name),
    address: val(permanent_address),
    guardianPhone: val(guardian_phone),
    bloodGroup: val(blood_group),
    department: val(department),
  };

  /* ---------------------- BANK + SALARY OPENERS ---------------------- */
  const openBankPopup = async () => {
    setBankOpen(true);
    if (bankInfo) return;

    setBankLoading(true);
    try {
      // Bank details are keyed on the string employee code (e.g. YTPL508IT),
      // NOT the numeric DB id. Also, GET /bank-details/{id} returns 500 on
      // the backend, so we fetch the full list and filter client-side.
      const empCode = employee_id || identifier;
      if (!empCode) {
        setBankInfo(null);
        return;
      }

      const listUrl = `${API_BASE}/bank-details/`;
      const raw = await fetchJSON(listUrl, token);
      const list = Array.isArray(raw)
        ? raw
        : raw?.data || raw?.items || raw?.results || [];
      const found =
        list.find(
          (r) => r?.employee_id === empCode || r?.employeeId === empCode,
        ) || null;
      setBankInfo(found);
    } catch (e) {
      toast.error(e?.message || "Failed to load bank details", {
        position: "top-center",
        autoClose: 1600,
        hideProgressBar: true,
      });
    } finally {
      setBankLoading(false);
    }
  };

  const openSalaryPopup = async () => {
    setSalaryOpen(true);
    if (salaryInfo) return;

    setSalaryLoading(true);
    try {
      // Salary records use numeric employee_id (not string code).
      // GET /salaries/ returns the full list; filter by numeric emp_id.
      const numericId = emp_id ?? employee?.id;
      const listUrl = `${API_BASE}/salaries/`;
      const raw = await fetchJSON(listUrl, token);
      const list = Array.isArray(raw)
        ? raw
        : raw?.data || raw?.items || raw?.results || [];
      const found =
        list.find((r) => String(r?.employee_id) === String(numericId)) || null;
      setSalaryInfo(found);
    } catch (e) {
      toast.error(e?.message || "Failed to load salary details", {
        position: "top-center",
        autoClose: 1600,
        hideProgressBar: true,
      });
    } finally {
      setSalaryLoading(false);
    }
  };

  return (
    <div className="bg-[#F1F5F9] min-h-screen caret-transparent">
      {/* ✅ If you already have ToastContainer globally, you can remove this */}
      <ToastContainer />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Card */}
        <div
          className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 border-t-4 overflow-hidden p-4 sm:p-6"
          style={{ borderTopColor: ACCENT }}
        >
          {/* Header */}
          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
            {M.hasAvatar ? (
              <img
                src={M.avatar}
                alt={M.name}
                className="w-32 h-32 rounded-full object-cover"
                style={{ border: `4px solid ${ACCENT}` }}
              />
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center bg-gray-100 text-3xl font-semibold text-gray-500"
                style={{ border: `4px solid ${ACCENT}` }}
              >
                {M.name?.[0] || "?"}
              </div>
            )}

            <div className="flex-1 lg:text-left w-full">
              {/* ✅ TOP ROW: Name + Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0e1b34] break-words">
                    {M.name}
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center justify-start gap-2">
                    <MdBadge
                      style={{ color: ACCENT }}
                      className="shrink-0 text-lg"
                    />
                    <span>{M.title}</span>
                  </p>
                </div>

                {/* ✅ NEW: Two Buttons (Employee Side) */}
                <div className="flex gap-2 sm:justify-end flex-shrink-0 w-full sm:w-auto">
                  <Motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={openBankPopup}
                    className="w-1/2 sm:w-auto px-4 py-2 rounded-xl border border-slate-200 bg-white text-[#0e1b34] hover:bg-[#FF5800] hover:text-white hover:border-[#FF5800] transition-all text-sm font-semibold shadow-sm"
                  >
                    Bank Details
                  </Motion.button>

                  <Motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={openSalaryPopup}
                    className="w-1/2 sm:w-auto px-4 py-2 rounded-xl bg-[#FF5800] hover:bg-[#d94d00] text-white transition-all text-sm font-semibold shadow-sm shadow-[#FF5800]/25"
                  >
                    Salary Details
                  </Motion.button>
                </div>
              </div>

              {/* Quick contact + dates */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2">
                {/* EMAIL */}
                <div className="flex items-center gap-3 text-[#0e1b34] min-w-0 lg:col-span-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MdEmail
                      style={{ color: ACCENT }}
                      className="shrink-0 text-lg"
                    />
                    <span
                      className="
                        min-w-0
                        break-words whitespace-normal
                        text-xs sm:text-sm
                        lg:whitespace-nowrap lg:overflow-visible
                      "
                      title={String(M.email ?? "")}
                    >
                      {M.email}
                    </span>
                  </div>
                  <CopyPill value={M.email} title="Copy email" />
                </div>

                {/* PHONE */}
                <div className="flex items-center gap-3 text-[#0e1b34] min-w-0 lg:col-span-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MdPhone
                      style={{ color: ACCENT }}
                      className="shrink-0 text-lg"
                    />
                    <span className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm">
                      {M.phone}
                    </span>
                  </div>
                  <CopyPill value={M.phone} title="Copy mobile" />
                </div>

                {/* DOJ */}
                <div className="flex items-center gap-3 text-[#0e1b34]">
                  <MdCalendarToday
                    style={{ color: ACCENT }}
                    className="shrink-0 text-lg"
                  />
                  <span className="text-sm">
                    <strong>DOJ:</strong> {M.doj}
                  </span>
                </div>

                {/* DOL */}
                <div className="flex items-center gap-3 text-[#0e1b34]">
                  <MdCalendarToday
                    style={{ color: ACCENT }}
                    className="shrink-0 text-lg"
                  />
                  <span className="text-sm">
                    <strong>DOL:</strong> {M.dol}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DetailRow label="Employee ID" value={M.id} />
            <DetailRow label="Department" value={M.department} />
            <DetailRow label="Designation" value={M.title} />
            <DetailRow label="Email" value={M.email} />
            <DetailRow label="Mobile" value={M.phone} />
            <DetailRow label="Date of Birth" value={M.dob} />
            <DetailRow label="Marital Status" value={M.maritalStatus} />
            <DetailRow label="Father / Guardian" value={M.guardianName} />

            {/* Optional extras */}
            {M.bloodGroup !== "—" && (
              <DetailRow label="Blood Group" value={M.bloodGroup} />
            )}
            {M.guardianPhone !== "—" && (
              <DetailRow label="Guardian Phone" value={M.guardianPhone} />
            )}

            {/* Address row (full width) */}
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <div className="flex items-start gap-2">
                  <MdHome
                    style={{ color: ACCENT }}
                    className="mt-[2px] shrink-0"
                  />
                  <div className="w-full min-w-0">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-sm font-medium text-[#0e1b34] break-words whitespace-normal mt-1">
                      {M.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------- BANK POPUP ------------------------- */}
          <AnimatePresence>
            {bankOpen && (
              <Motion.div
                className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setBankOpen(false)}
              >
                <Motion.div
                  className="bg-white rounded-xl shadow-xl max-w-md w-full border"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 30, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-5 py-4 border-b flex items-center justify-between">
                    <div className="font-semibold">Bank Details</div>
                    <button
                      onClick={() => setBankOpen(false)}
                      className="text-sm px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200"
                    >
                      Close
                    </button>
                  </div>

                  <div className="px-5 py-4">
                    {bankLoading ? (
                      <div className="text-sm text-slate-600">Loading...</div>
                    ) : !bankInfo ? (
                      <div className="text-sm text-slate-600">
                        No bank details found.
                      </div>
                    ) : (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Bank Name</span>
                          <span className="font-medium text-right">
                            {bankInfo.bank_name || bankInfo.bankName || "—"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 items-center">
                          <span className="text-slate-500">Account No</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {bankInfo.account_number ||
                                bankInfo.accountNumber ||
                                bankInfo.acc_no ||
                                "—"}
                            </span>
                            <button
                              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                              onClick={() =>
                                copyToClipboard(
                                  bankInfo.account_number ||
                                    bankInfo.accountNumber ||
                                    bankInfo.acc_no ||
                                    "",
                                )
                              }
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between gap-4 items-center">
                          <span className="text-slate-500">IFSC</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {bankInfo.ifsc_code || bankInfo.ifscCode || "—"}
                            </span>
                            <button
                              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                              onClick={() =>
                                copyToClipboard(
                                  bankInfo.ifsc_code || bankInfo.ifscCode || "",
                                )
                              }
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Branch</span>
                          <span className="font-medium text-right">
                            {bankInfo.branch || bankInfo.branch_name || "—"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">UPI</span>
                          <span className="font-medium text-right">
                            {bankInfo.upi || bankInfo.upi_id || "—"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Motion.div>
              </Motion.div>
            )}
          </AnimatePresence>

          {/* ------------------------- SALARY POPUP ------------------------ */}
          <AnimatePresence>
            {salaryOpen && (
              <Motion.div
                className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSalaryOpen(false)}
              >
                <Motion.div
                  className="bg-white rounded-xl shadow-xl max-w-md w-full border"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 30, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-5 py-4 border-b flex items-center justify-between">
                    <div className="font-semibold">Salary Details</div>
                    <button
                      onClick={() => setSalaryOpen(false)}
                      className="text-sm px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200"
                    >
                      Close
                    </button>
                  </div>

                  <div className="px-5 py-4">
                    {salaryLoading ? (
                      <div className="text-sm text-slate-600">Loading...</div>
                    ) : !salaryInfo ? (
                      <div className="text-sm text-slate-600">
                        No salary details found.
                      </div>
                    ) : (() => {
                        const fmt = (v) =>
                          v != null ? `₹${Number(v).toLocaleString("en-IN")}` : "—";
                        const breakdowns = Array.isArray(salaryInfo.breakdowns)
                          ? salaryInfo.breakdowns
                          : [];
                        let allowanceTotal = 0;
                        let deductionTotal = 0;
                        breakdowns.forEach((b) => {
                          const amt = Number(b?.amount) || 0;
                          if (String(b?.rule_type || "").toUpperCase() === "DEDUCTION") {
                            deductionTotal += amt;
                          } else {
                            allowanceTotal += amt;
                          }
                        });
                        return (
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Base Salary</span>
                              <span className="font-medium text-right">
                                {fmt(salaryInfo.base_salary)}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Allowances</span>
                              <span className="font-medium text-right">
                                {allowanceTotal > 0 ? fmt(allowanceTotal) : "—"}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Deductions</span>
                              <span className="font-medium text-right">
                                {deductionTotal > 0 ? `-${fmt(deductionTotal)}` : "—"}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4 pt-2 border-t">
                              <span className="text-slate-500">Gross Salary</span>
                              <span className="font-semibold text-right">
                                {fmt(salaryInfo.gross_salary)}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                </Motion.div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
