// src/pages/EmployeeProfile.jsx
import React, { useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  FiCopy, FiHash, FiUser, FiBriefcase, FiMapPin, FiCalendar,
} from "react-icons/fi";
import {
  MdEmail, MdPhone, MdInfo, MdBadge, MdCalendarToday, MdHome,
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
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch { return v; }
};
const safe = (v) => (v === null || v === undefined || `${v}`.trim() === "" ? "—" : v);

const b64urlToJSON = (b64url) => {
  try {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64).split("").map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`).join("")
    );
    return JSON.parse(json);
  } catch { return null; }
};

const extractIdsFromJWT = (token) => {
  if (!token || typeof token !== "string" || token.split(".").length < 2) return {};
  const [, payload] = token.split(".");
  const data = b64urlToJSON(payload) || {};
  return {
    numericId: data.id ?? data.user_id ?? (data.employee && data.employee.id) ?? null,
    code: data.employee_id ?? data.employeeId ?? (data.employee && data.employee.employee_id) ?? null,
  };
};

const getNumericIdFromUser = (u) =>
  u?.id != null ? u.id : u?.employee?.id != null ? u.employee.id : null;
const getCodeFromUser = (u) => u?.employee_id ?? u?.employeeId ?? u?.employee?.employee_id ?? null;

/* ------------------------------- SHARED ATOMS ----------------------------- */
const val = (v, fallback = "—") =>
  v === null || v === undefined || `${v}`.trim() === "" ? fallback : v;

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-[#0e1b34] break-all">{value}</span>
    </div>
  );
}

const CopyPill = ({ value, title = "Copy" }) => {
  if (!value || value === "—") return null;
  const doCopy = () => navigator.clipboard?.writeText(String(value)).catch(() => {});
  return (
    <button
      onClick={doCopy}
      title={title}
      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-[#0e1b34] hover:bg-gray-50"
      type="button"
    >
      <FiCopy /> Copy
    </button>
  );
};

/* ------------------------------- SKELETON --------------------------------- */
const Skeleton = () => (
  <div className="p-6 bg-[#f4f6fa] min-h-screen caret-transparent">
    <div className="mb-4 h-5 w-20 bg-gray-200 rounded" />
    <div className="bg-white rounded-xl shadow-lg p-6 border-t-4" style={{ borderColor: ACCENT }}>
      <div className="flex flex-col md:flex-row gap-6 items-start">
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
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg border" />
        ))}
        <div className="col-span-1 md:col-span-2 h-16 bg-gray-50 rounded-md border" />
      </div>
      <div className="mt-6 h-24 bg-gray-50 rounded-md border" />
    </div>
  </div>
);

/* ------------------------------- PAGE ------------------------------------- */
export default function EmployeeProfilePage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, token } = useSelector((s) => s.auth || {});
  const loading  = useSelector(selectEmployeeLoading);
  const error    = useSelector(selectEmployeeError);
  const employee = useSelector(selectEmployee);

  const identifier = useMemo(() => {
    const fromParams = params.identifier ?? params.employeeId ?? params.id_ ?? params.id;
    const fromState  = location?.state?.identifier;
    const authNumeric = getNumericIdFromUser(user);
    const authCode    = getCodeFromUser(user);

    let lsNumeric = null, lsCode = null;
    try {
      const raw = localStorage.getItem("auth") || localStorage.getItem("user");
      if (raw) {
        const o = JSON.parse(raw);
        const u = o?.user || o;
        lsNumeric = getNumericIdFromUser(u);
        lsCode    = getCodeFromUser(u);
      }
    } catch {}

    const { numericId: jwtNumeric, code: jwtCode } =
      extractIdsFromJWT(token) || extractIdsFromJWT(localStorage.getItem("token")) || {};

    const chosen =
      (fromParams ?? fromState) ??
      (authNumeric != null ? String(authNumeric) : null) ??
      (jwtNumeric  != null ? String(jwtNumeric)  : null) ??
      (lsNumeric   != null ? String(lsNumeric)   : null) ??
      authCode ?? jwtCode ?? lsCode ?? "";

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
    pan,
    aadhar,
    overview,
    guardian_name,
    guardian_phone,
    blood_group,
  } = employee;

  const M = {
    id: val(employee_id || emp_id),
    name: val(name),
    avatar: val(
      employee?.profile ||
      employee?.photo ||
      employee?.avatar ||
      "https://i.pravatar.cc/150?img=12"
    ),
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
    overview: val(
      overview ||
      "No overview provided. This space can contain a short bio, responsibilities, and achievements."
    ),
    guardianPhone: val(guardian_phone),
    bloodGroup: val(blood_group),
    department: val(department),
  };

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen caret-transparent">
      {/* Back
      <button
        onClick={() => navigate(-1)}
        className="mb-4 underline cursor-pointer"
        style={{ color: ACCENT }}
      >
        ← Back
      </button> */}

      {/* Card */}
      <div
        className="bg-white rounded-xl shadow-lg p-6 border-t-4"
        style={{ borderColor: ACCENT }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <img
            src={M.avatar}
            alt={M.name}
            className="w-32 h-32 rounded-full object-cover"
            style={{ border: `4px solid ${ACCENT}` }}
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#0e1b34]">{M.name}</h2>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <MdBadge style={{ color: ACCENT }} />
              <span>{M.title} {M.department !== "—" ? `• ${M.department}` : ""}</span>
            </p>

            {/* Quick contact + dates */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <p className="flex items-center gap-2 text-[#0e1b34]">
                <MdEmail style={{ color: ACCENT }} />
                <span className="break-all">{M.email}</span>
                <CopyPill value={M.email} title="Copy email" />
              </p>
              <p className="flex items-center gap-2 text-[#0e1b34]">
                <MdPhone style={{ color: ACCENT }} />
                <span className="break-all">{M.phone}</span>
                <CopyPill value={M.phone} title="Copy mobile" />
              </p>
              <p className="flex items-center gap-2 text-[#0e1b34]">
                <MdCalendarToday style={{ color: ACCENT }} />
                <span><strong>DOJ:</strong> {M.doj}</span>
              </p>
              <p className="flex items-center gap-2 text-[#0e1b34]">
                <MdCalendarToday style={{ color: ACCENT }} />
                <span><strong>DOL:</strong> {M.dol}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailRow label="Employee ID" value={M.id} />
          <DetailRow label="Department" value={M.department} />
          <DetailRow label="Designation" value={M.title} />
          <DetailRow label="Email" value={M.email} />
          <DetailRow label="Mobile" value={M.phone} />
          <DetailRow label="Date of Birth" value={M.dob} />
          <DetailRow label="Marital Status" value={M.maritalStatus} />
          <DetailRow label="Father / Guardian" value={M.guardianName} />

          {/* Optional extras */}
          {M.bloodGroup !== "—" && <DetailRow label="Blood Group" value={M.bloodGroup} />}
          {M.guardianPhone !== "—" && <DetailRow label="Guardian Phone" value={M.guardianPhone} />}

          {/* Address row (full width) */}
          <div className="col-span-1 md:col-span-2">
            <p className="flex items-start gap-2 text-sm text-gray-700">
              <MdHome style={{ color: ACCENT }} className="mt-1" />
              <span className="break-words">{M.address}</span>
            </p>
          </div>
        </div>

        {/* Overview box */}
        <div className="mt-6 bg-[#fefefe] p-4 rounded-md border border-gray-200">
          <p className="flex items-start gap-2 text-sm text-gray-700">
            <MdInfo style={{ color: ACCENT }} className="mt-1" />
            <span className="leading-6">{M.overview}</span>
          </p>
        </div>

        {/* Secondary quick facts */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <FactPill icon={<FiHash />} label="DB Internal ID" value={safe(emp_id)} accent={ACCENT} />
          <FactPill icon={<FiCalendar />} label="Joined" value={safe(M.doj)} accent={ACCENT} />
          <FactPill icon={<FiCalendar />} label="Left" value={safe(M.dol)} accent={ACCENT} />
          <FactPill icon={<FiUser />} label="Marital" value={safe(M.maritalStatus)} accent={ACCENT} />
          <FactPill icon={<FiMapPin />} label="Address" value={safe(M.address)} accent={ACCENT} />
          <FactPill icon={<FiBriefcase />} label="Role" value={safe(M.title)} accent={ACCENT} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- EXTRAS ----------------------------------- */
function FactPill({ icon, label, value, accent }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-gray-200 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-gray-600 text-sm">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </span>
      <span className="text-sm font-medium text-[#0e1b34] break-all">{value}</span>
    </div>
  );
}
