// src/components/employee/Department.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadDepartmentEmployees } from "../../redux/actions/departmentActions";
import { toast, Slide } from "react-toastify";

const TITLE = {
  hr: "HR Employees",
  developer: "Software Developers",
  marketing: "Marketing Employees",
  finance: "Finance Employees",
  sales: "Sales Employees",
};

/* 🔔 Toast pill config */
const TOAST_BASE = {
  position: "top-center",
  transition: Slide,
  autoClose: 1800,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
};

const PILL = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  width: "auto",
  maxWidth: "min(72vw, 260px)",
  padding: "5px 9px",
  lineHeight: 1.2,
  minHeight: 0,
  borderRadius: "10px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
  fontSize: "0.80rem",
  fontWeight: 600,
};

const STYLE_ERROR = {
  ...PILL,
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
};

export default function Department({ dept = "hr" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items = [], loading, error } = useSelector((s) => s.department || {});

  useEffect(() => {
    dispatch(
      loadDepartmentEmployees({ routeDept: dept, limit: 50, offset: 0 })
    );
  }, [dispatch, dept]);

  useEffect(() => {
    if (error) {
      const msg =
        typeof error === "string"
          ? error
          : error?.message || "Failed to load employees. Please try again.";
      toast(msg, {
        ...TOAST_BASE,
        style: STYLE_ERROR,
        icon: false,
      });
    }
  }, [error]);

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-[#223366]">
        {TITLE[dept] || "Employees"}
      </h1>

      {loading && <p>Loading employees...</p>}
      {error && <p className="text-red-500">{String(error)}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-gray-600">No employees found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((row) => {
          const id = (row.employee_id || row.employeeId || row.id || "").trim();
          const avatarRaw =
            row.profile || row.profile_picture || row.avatar || null;
          const avatarSrc = avatarRaw
            ? avatarRaw.startsWith("data:")
              ? avatarRaw
              : `data:image/jpeg;base64,${avatarRaw.trim()}`
            : null;

          return (
            <div
              key={id || row.email}
              onClick={() =>
                id && navigate(`/employees/${dept}/${encodeURIComponent(id)}`)
              }
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer p-6 flex flex-col items-center text-center border-t-4 border-[#FF5800]"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={row.name}
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#FF5800]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 mb-4 border-2 border-[#FF5800] flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}

              <h2 className="text-xl font-semibold text-[#0e1b34]">
                {row.name}
              </h2>
              <p className="text-sm text-gray-600">
                {row.designation || row.role || row.department}
              </p>
              <p className="text-sm text-gray-500">{row.email}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
