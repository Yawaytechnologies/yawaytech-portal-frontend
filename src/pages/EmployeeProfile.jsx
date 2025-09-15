// src/pages/EmployeeProfile.jsx
import React, { useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import {
  FiMail,
  FiPhone,
  FiCalendar,
  FiBriefcase,
  FiHash,
  FiUser,
  FiCopy,
  FiMapPin,
} from "react-icons/fi";

import { fetchEmployeeById } from "../redux/actions/employeeProfileActions";
import { resetEmployee } from "../redux/reducer/employeeProfileSlice";

import {
  selectEmployee,
  selectEmployeeLoading,
  selectEmployeeError,
  selectEmployeeUsedDemo,
} from "../redux/reducer/employeeProfileSlice";

/* ------------------------------- UTILS ------------------------------------ */
const fmtDate = (v) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return v;
  }
};
const safe = (v) => (v === null || v === undefined || `${v}`.trim() === "" ? "—" : v);

/* ------------------------------- ATOMS ------------------------------------ */
const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl border bg-white/70 backdrop-blur p-5 shadow-sm ${className}`}>{children}</div>
);

const SectionTitle = ({ children }) => (
  <h2 className="mb-4 text-base font-semibold text-gray-900">{children}</h2>
);

const ItemRow = ({ left, children }) => (
  <li className="flex items-center justify-between">
    <span className="text-gray-500">{left}</span>
    {children}
  </li>
);

const TextRow = ({ left, value, icon }) => (
  <li className="flex items-start justify-between gap-3">
    <span className="text-gray-500 mt-0.5 flex items-center gap-1.5">
      {icon ? <span className="text-gray-400">{icon}</span> : null}
      {left}
    </span>
    <span className="font-medium text-gray-900 text-right max-w-[60%] break-words">
      {safe(value)}
    </span>
  </li>
);

const Field = ({ label, value, icon, copyable, isDate }) => {
  const val = isDate ? fmtDate(value) : safe(value);
  const copy = () => value && navigator.clipboard?.writeText(String(value)).catch(() => {});
  return (
    <div className="p-2 rounded-xl bg-white">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {icon} <span>{label}</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <div className="font-medium text-gray-900 break-all">{val}</div>
        {copyable && value ? (
          <button
            onClick={copy}
            className="ml-3 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
            title="Copy"
            type="button"
          >
            <FiCopy className="text-base" />
            Copy
          </button>
        ) : null}
      </div>
    </div>
  );
};

const Badge = ({ icon, text }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/25">
    <span className="text-sm">{icon}</span>
    <span className="text-xs font-medium tracking-wide">{text}</span>
  </span>
);

const Dot = () => <span className="mx-1.5 h-1.5 w-1.5 rounded-full bg-white/70 inline-block" />;

const ActionButton = ({ href, icon, label, disabled }) => {
  const content = (
    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white/80 text-gray-800 hover:bg-white transition">
      {icon} <span className="text-sm font-medium truncate max-w-[180px]">{label}</span>
    </span>
  );
  if (disabled || !href) return <span className="opacity-60 cursor-not-allowed">{content}</span>;
  return (
    <a href={href} className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg">
      {content}
    </a>
  );
};

const Avatar = ({ src, alt, initials }) => {
  const fallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>
         <rect width='100%' height='100%' fill='#EEF2FF'/>
         <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='56' fill='#4338CA' font-family='Inter, Arial, sans-serif'>${initials}</text>
       </svg>`
    );
  return (
    <img
      src={src || fallback}
      alt={alt || "Employee"}
      className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
      onError={(e) => (e.currentTarget.src = fallback)}
    />
  );
};

/* ------------------------------- SKELETONS -------------------------------- */
const Skeleton = () => (
  <div className="max-w-5xl mx-auto pb-6 pt-1 animate-pulse">
    <div className="h-36 rounded-2xl bg-gradient-to-br from-indigo-100 via-indigo-50 to-sky-50 border" />
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-3">
        <div className="h-8 bg-gray-100 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-8 bg-gray-100 rounded" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

/* ------------------------------- DEMO FALLBACK ---------------------------- */
const DEMO = {
  name: "Sowjanya S",
  employeeId: "EMP000001",
  email: "sowjanya@yawaytech.com",
  mobile: "+91 98765 43210",
  designation: "Software Developer",
  department: "IT",
  joinDate: "2024-06-12",
  avatarUrl: "",
  status: "Active",
  address: "No. 14, 2nd Cross, JP Nagar, Bangalore 560078",
  officeAddress: "Yaway Technologies, 2nd Floor, OMR, Chennai 600119",
  fatherName: "K. Ramesh",
  fatherNumber: "+91 98765 43210",
  bloodGroup: "O+",
  dob: "1990-05-15",
};

/* ------------------------------- MAIN PROFILE ----------------------------- */
export default function EmployeeProfilePage() {
  const { employeeId } = useParams(); // route like: /employees/:employeeId
  const dispatch = useDispatch();

  const loading = useSelector(selectEmployeeLoading);
  const error = useSelector(selectEmployeeError);
  const employee = useSelector(selectEmployee);
  const usedDemo = useSelector(selectEmployeeUsedDemo);

  useEffect(() => {
    dispatch(resetEmployee());
    if (employeeId) dispatch(fetchEmployeeById(employeeId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, dispatch]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          Failed to load employee: {error}
        </div>
      </div>
    );
  }

  const profile = employee || DEMO;

  const initials = useMemo(() => {
    if (!profile?.name) return "👤";
    return profile.name
      .split(" ")
      .map((n) => n?.[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  }, [profile?.name]);

  return (
    <div className="max-w-5xl mx-auto text-gray-900 pb-6 pt-1">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-600/80 via-indigo-500/70 to-sky-500/70">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />

        <div className="relative p-6 md:p-8 flex flex-col sm:flex-row sm:items-end gap-5">
          <Avatar src={profile.avatarUrl} alt={profile.name} initials={initials} />

          <div className="text-white">
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
              {safe(profile.name)}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/90">
              <Badge icon={<FiBriefcase />} text={safe(profile.designation)} />
              <Dot />
              <span className="font-medium">{safe(profile.department)}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <ActionButton
                href={profile.email ? `mailto:${profile.email}` : undefined}
                icon={<FiMail aria-hidden />}
                label={safe(profile.email)}
                disabled={!profile.email}
              />
              <ActionButton
                href={profile.mobile ? `tel:${profile.mobile}` : undefined}
                icon={<FiPhone aria-hidden />}
                label={safe(profile.mobile)}
                disabled={!profile.mobile}
              />
            </div>

            {usedDemo && (
              <div className="mt-3 text-xs text-white/90">
                Showing demo data (API unavailable).
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <SectionTitle>Overview</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" icon={<FiUser />} value={profile.name} />
            <Field label="Employee ID" icon={<FiHash />} value={profile.employeeId} />
            <Field label="Designation" icon={<FiBriefcase />} value={profile.designation} />
            <Field label="Department" icon={<FiBriefcase />} value={profile.department} />
            <Field label="Email" icon={<FiMail />} value={profile.email} copyable />
            <Field label="Mobile" icon={<FiPhone />} value={profile.mobile} copyable />
            <Field label="Date of Joining" icon={<FiCalendar />} value={profile.joinDate} isDate />
            <Field label="Date of Birth" icon={<FiCalendar />} value={profile.dob} isDate />
          </div>
        </Card>

        <Card>
          <SectionTitle>Quick Info</SectionTitle>
          <ul className="space-y-3 text-sm">
            <ItemRow left="Status">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                {safe(profile.status)}
              </span>
            </ItemRow>

            <TextRow left="Address" value={profile.address} icon={<FiMapPin />} />
            <TextRow left="Office Address" value={profile.officeAddress} icon={<FiMapPin />} />
            <ItemRow left="Father's Name">
              <span className="font-medium text-gray-900">{safe(profile.fatherName)}</span>
            </ItemRow>
            <ItemRow left="Father's Number">
              <span className="font-medium text-gray-900">{safe(profile.fatherNumber)}</span>
            </ItemRow>
            <ItemRow left="Blood Group">
              <span className="font-medium text-gray-900">{safe(profile.bloodGroup)}</span>
            </ItemRow>
          </ul>
        </Card>
      </div>
    </div>
  );
}
