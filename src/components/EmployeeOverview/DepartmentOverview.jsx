// src/components/EmployeeOverview/DepartmentOverview.jsx
import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDepartmentEmployeeById,
} from "../../redux/actions/departmentOverviewAction";
import { departmentDetailReset } from "../../redux/reducer/departmentOverviewSlice";
import {
  MdEmail,
  MdPhone,
  MdBadge,
  MdCalendarToday,
  MdHome,
  MdWorkHistory,
  MdMonitor,
} from "react-icons/md";
import { EMP_ID_RE } from "../../redux/services/departmentOverviewService";

/* ---------- utils ---------- */
const val = (v, fb = "—") =>
  v === null || v === undefined || `${v}`.trim() === "" ? fb : v;

const todayISO = () => new Date().toISOString().slice(0, 10);

const DEPT_TITLE = {
  hr: "HR",
  it: "IT",
  "software-developer": "Software Developer",
  developer: "Software Developer",
  sales: "Sales",
  finance: "Finance",
  marketing: "Marketing",
};

export default function DepartmentOverview() {
  // Route like: /employees/:department/:employeeId
  const { department = "", employeeId = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedEmployee, loading, error } = useSelector(
    (s) => s.departmentOverview || {}
  );

  useEffect(() => {
    const id = (employeeId || "").trim().toUpperCase();

    // If no id or invalid => bounce back to the department list
    if (!id || !EMP_ID_RE.test(id)) {
      navigate(`/employees/${department}`);
      return;
    }

    dispatch(departmentDetailReset());
    dispatch(fetchDepartmentEmployeeById({ employeeId: id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, department, employeeId, navigate]);

  const M = useMemo(() => {
    const e = selectedEmployee || {};
    const avatar = e.profile || e.profile_picture || e.avatar || null;

    return {
      id: val(e.employeeId || e.employee_id || e.id),
      name: val(e.name),
      avatar,
      title: val(
        e.designation ||
          e.jobTitle ||
          e.role ||
          DEPT_TITLE[String(department).toLowerCase()] ||
          "Employee"
      ),
      email: val(e.email),
      phone: val(e.mobile_number || e.phone || e.mobile || e.mobileNumber),
      doj: val(e.date_of_joining || e.doj || e.dateOfJoining),
      dol: val(e.date_of_leaving || e.dol || e.dateOfLeaving || "—"),
      pan: val(e.pan || e.pan_number || e.panNumber),
      aadhar: val(
        e.aadhar ||
          e.aadhaar ||
          e.aadhar_number ||
          e.aadhaar_number ||
          e.aadharNumber ||
          e.aadhaarNumber
      ),
      dob: val(e.date_of_birth || e.dob || e.dateOfBirth),
      maritalStatus: val(e.marital_status || e.maritalStatus),
      GuardianName: val(
        e.guardian_name || e.GuardianName || e.father_name || e.parentName
      ),
      address: val(e.permanent_address || e.address || e.currentAddress),
      overview: val(e.overview || "—"),
      // guardianPhone: val(e.guardian_phone || e.guardianPhone || e.parentPhone),
      // bloodGroup: val(e.blood_group || e.bloodGroup || e.bloodType),
    };
  }, [selectedEmployee, department]);

  useEffect(() => {
    if (M.id) localStorage.setItem("ytp_employee_id", String(M.id));
  }, [M.id]);

  if (loading) return <p className="p-4 sm:p-6">Loading employee details...</p>;
  if (error) return <p className="p-4 sm:p-6 text-red-600">{String(error)}</p>;
  if (!selectedEmployee)
    return <p className="p-4 sm:p-6 text-red-600">Employee not found</p>;

  return (
    <div className="min-h-screen bg-[#f4f6fa] caret-transparent">
      <div className="mx-auto w-full max-w-5xl px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 sm:mb-4 text-[#FF5800] underline underline-offset-2"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl border-t-4 border-[#FF5800] p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            {/* Left: avatar + name */}
            <div className="flex items-start gap-4 sm:gap-6">
              {M.avatar ? (
                <img
                  src={M.avatar}
                  alt={M.name}
                  className="rounded-full object-cover border-4 border-[#FF5800]
                             w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
                />
              ) : (
                <div
                  className="rounded-full bg-gray-100 border-4 border-[#FF5800] flex items-center justify-center
                             w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
                >
                  <span className="text-gray-500 text-xs sm:text-sm">No Image</span>
                </div>
              )}

              <div>
                <h2
                  className="font-bold text-[#0e1b34]
                               text-xl sm:text-2xl md:text-3xl leading-snug"
                >
                  {M.name}
                </h2>
                <p className="mt-1 flex items-center gap-2 text-gray-600 text-xs sm:text-sm">
                  <MdBadge className="text-[#FF5800]" />
                  <span>{M.title}</span>
                </p>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link
                to={`/employees/${encodeURIComponent(
                  String(department)
                )}/${encodeURIComponent(String(M.id))}/worklog`}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2
                           text-xs sm:text-sm font-medium text-[#0e1b34] hover:bg-gray-50"
                title="Open Worklog"
              >
                <MdWorkHistory className="text-[#FF5800]" />
                Worklog
              </Link>

              <Link
                to={`/monitoring?id=${encodeURIComponent(
                  String(M.id)
                )}&day=${todayISO()}`}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2
                           text-xs sm:text-sm font-medium text-[#0e1b34] hover:bg-gray-50"
                title="Open Monitoring"
              >
                <MdMonitor className="text-[#FF5800]" />
                Monitor
              </Link>
            </div>
          </div>

          {/* Contact & dates */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <p className="flex items-center gap-2 text-[#0e1b34] text-sm">
              <MdEmail className="text-[#FF5800]" />
              <span className="break-all">{M.email}</span>
            </p>
            <p className="flex items-center gap-2 text-[#0e1b34] text-sm">
              <MdPhone className="text-[#FF5800]" />
              <span className="break-all">{M.phone}</span>
            </p>
            <p className="flex items-center gap-2 text-[#0e1b34] text-sm">
              <MdCalendarToday className="text-[#FF5800]" />
              <span>
                <strong>DOJ:</strong> {M.doj}
              </span>
            </p>
            <p className="flex items-center gap-2 text-[#0e1b34] text-sm">
              <MdCalendarToday className="text-[#FF5800]}" />
              <span>
                <strong>DOL:</strong> {M.dol}
              </span>
            </p>
          </div>

          {/* Details grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <DetailRow label="Employee ID" value={M.id} />
            <DetailRow label="PAN" value={M.pan} />
            <DetailRow label="Aadhar" value={M.aadhar} />
            <DetailRow label="Date of Birth" value={M.dob} />
            <DetailRow label="Marital Status" value={M.maritalStatus} />
            <DetailRow label="Guardian's Name" value={M.GuardianName} />
            {/* <DetailRow label="Guardian Phone" value={M.guardianPhone} /> */}
            {/* <DetailRow label="Blood Group" value={M.bloodGroup} /> */}

            {/* Address card */}
            <div className="col-span-1 md:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-white/60 px-3 py-3 sm:px-4 sm:py-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 grid place-items-center w-8 h-8 rounded-full bg-orange-50 border border-orange-200">
                    <MdHome className="text-[#FF5800]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-500 mb-1">
                      Address
                    </div>
                    <div className="text-sm text-[#0e1b34] break-words">{M.address}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>{/* /grid */}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 border border-gray-200">
      <span className="text-xs sm:text-sm text-gray-600">{label}</span>
      <span className="text-sm sm:text-base font-medium text-[#0e1b34] break-all text-right">
        {value}
      </span>
    </div>
  );
}
