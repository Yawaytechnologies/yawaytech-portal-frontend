// src/components/EmployeeOverview/SoftwareDeveloperOverview.jsx
import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchSoftwareDeveloperById } from "../../redux/actions/softwareDevOverviewAction";
import {
  MdEmail,
  MdPhone,
  MdInfo,
  MdBadge,
  MdCalendarToday,
  MdHome,
  MdWorkHistory,
} from "react-icons/md";

const val = (v, fallback = "—") =>
  v === null || v === undefined || `${v}`.trim() === "" ? fallback : v;

export default function SoftwareDeveloperOverview() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedDeveloper, loading, error } =
    useSelector((s) => s.softwareDevOverview || {});

  useEffect(() => {
    const id = (employeeId || "").trim();
    if (!id) {
      // if no id, go back to developer list (adjust route if your list route differs)
      navigate("/employees/developer");
      return;
    }
    // reset reducer state (use the action type your reducer expects)
    dispatch({ type: "SE_DETAIL_RESET" });
    dispatch(fetchSoftwareDeveloperById(id));
  }, [dispatch, employeeId, navigate]);

  const M = useMemo(() => {
    const e = selectedDeveloper || {};
    // avatar source can be data: url, absolute URL, or null
    const avatar = e.profile || e.photo || e.avatar || null;

    return {
      id: val(e.employeeId || e.id),
      name: val(e.name),
      avatar, // may be null -> handled in JSX
      title: val(e.jobTitle || e.designation || e.role || "Software Engineer"),
      email: val(e.email),
      phone: val(e.phone || e.mobile || e.mobile_number),
      doj: val(e.doj || e.date_of_joining || e.joiningDate),
      dol: val(e.dol || e.date_of_leaving || "—"),
      pan: val(e.pan || e.panNumber),
      aadhar: val(e.aadhar || e.aadhaar || e.aadharNumber || e.aadhaarNumber),
      dob: val(e.dob || e.date_of_birth),
      maritalStatus: val(e.maritalStatus || e.marital_status),
      guardianName: val(e.guardianName || e.father_name || e.parentName),
      address: val(e.address || e.permanent_address || e.currentAddress),
      overview: val(e.overview || e.bio || e.description || "—"),
      guardianPhone: val(
        e.guardianPhone ||
          e.guardian_phone ||
          e.guardianMobile ||
          e.guardian_mobile ||
          e.guardianContact ||
          e.parentPhone ||
          e.parentMobile
      ),
      bloodGroup: val(
        e.bloodGroup || e.blood_group || e.bg || e.bloodType || e.blood_type
      ),
    };
  }, [selectedDeveloper]);

  if (loading) return <p className="p-6">Loading developer details...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!selectedDeveloper) return <p className="p-6 text-red-600">Developer not found</p>;

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen caret-transparent">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-[#FF5800] underline cursor-pointer"
      >
        ← Back
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#FF5800]">
        {/* Header: left (avatar+title), right (button) */}
        <div className="flex items-start justify-between gap-6">
          {/* Left */}
          <div className="flex items-start gap-6">
            {M.avatar ? (
              <img
                src={M.avatar}
                alt={M.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-[#FF5800]"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-[#FF5800] flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-[#0e1b34]">{M.name}</h2>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                <MdBadge className="text-[#FF5800]" />
                <span>{M.title}</span>
              </p>
            </div>
          </div>

          {/* Right (top-right button) */}
          <Link
            to="/all-worklogs"
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-[#0e1b34] hover:bg-gray-50 ml-auto"
            title="Open Worklog"
          >
            <MdWorkHistory className="text-[#FF5800]" />
            Worklog
          </Link>
        </div>

        {/* Contact + dates grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <p className="flex items-center gap-2 text-[#0e1b34]">
            <MdEmail className="text-[#FF5800]" />
            <span className="break-all">{M.email}</span>
          </p>
          <p className="flex items-center gap-2 text-[#0e1b34]">
            <MdPhone className="text-[#FF5800]" />
            <span className="break-all">{M.phone}</span>
          </p>
          <p className="flex items-center gap-2 text-[#0e1b34]">
            <MdCalendarToday className="text-[#FF5800]" />
            <span>
              <strong>DOJ:</strong> {M.doj}
            </span>
          </p>
          <p className="flex items-center gap-2 text-[#0e1b34]">
            <MdCalendarToday className="text-[#FF5800]" />
            <span>
              <strong>DOL:</strong> {M.dol}
            </span>
          </p>
        </div>

        {/* Details grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailRow label="Employee ID" value={M.id} />
          <DetailRow label="PAN" value={M.pan} />
          <DetailRow label="Aadhar" value={M.aadhar} />
          <DetailRow label="Date of Birth" value={M.dob} />
          <DetailRow label="Marital Status" value={M.maritalStatus} />
          <DetailRow label="Guardian's Name" value={M.guardianName} />
          <DetailRow label="Guardian Phone" value={M.guardianPhone} />
          <DetailRow label="Blood Group" value={M.bloodGroup} />

          <div className="col-span-1 md:col-span-2">
            <p className="flex items-start gap-2 text-sm text-gray-700">
              <MdHome className="text-[#FF5800] mt-1" />
              <span className="break-words">{M.address}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 bg-[#fefefe] p-4 rounded-md border border-gray-200">
          <p className="flex items-start gap-2 text-sm text-gray-700">
            <MdInfo className="text-[#FF5800] mt-1" />
            <span className="leading-6">{M.overview}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-[#0e1b34] break-all">{value}</span>
    </div>
  );
}
