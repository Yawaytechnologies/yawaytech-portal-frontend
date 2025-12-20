// src/pages/EmployeeProfile.jsx
import React, { useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation } from "react-router-dom";
import { FiCopy } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import {
  MdEmail,
  MdPhone,
  MdInfo,
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
        .join("")
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
    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <span className="text-xs sm:text-sm text-gray-600 shrink-0">
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

const CopyPill = ({ value, title = "Copy" }) => {
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
  <div className="bg-[#f4f6fa] min-h-screen caret-transparent">
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
    } // keep block non-empty for lint

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

  // 🔹 build avatar from backend fields only (no dummy URL)
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

  return (
    <div className="bg-[#f4f6fa] min-h-screen caret-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Card */}
        <div
          className="w-full bg-white rounded-xl shadow-lg border-t-4 overflow-hidden p-4 sm:p-6"
          style={{ borderColor: ACCENT }}
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
            <div className="flex-1 lg:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0e1b34] whitespace-nowrap overflow-x-auto">
                {M.name}
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center justify-start gap-2">
                <MdBadge
                  style={{ color: ACCENT }}
                  className="shrink-0 text-lg"
                />
                <span>{M.title}</span>
              </p>

              {/* Quick contact + dates */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2">
                {/* ✅ EMAIL (full line + proper gap + Copy right) */}
                <div className="flex items-center  gap-3 text-[#0e1b34] min-w-0 lg:col-span-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MdEmail
                      style={{ color: ACCENT }}
                      className="shrink-0 text-lg"
                    />
                    <span
                      className="
                            min-w-0
                            break-word whitespace-normal
                            text-xs sm:text-sm
                            lg:whitespace-nowrap lg:overflow-visible"
                      title={String(M.email ?? "")}
                    >
                      {M.email}
                    </span>
                  </div>
                  <CopyPill value={M.email} title="Copy email" />
                </div>

                {/* PHONE */}
                <div className="flex items-center  gap-3 text-[#0e1b34] min-w-0 lg:col-span-2">
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
        </div>
      </div>
    </div>
  );
}
