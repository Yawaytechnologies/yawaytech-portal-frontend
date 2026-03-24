// src/components/employee/Department.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadDepartmentEmployees } from "../../redux/actions/departmentActions";
import { toast, Slide } from "react-toastify";

const TITLE = {
  hr: "HR Employees",
  it: "IT Employees",
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
    <div className="p-3 sm:p-6 bg-[#F1F5F9] min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0e1b34]">
          {TITLE[dept] || "Employees"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Select an employee to view their profile</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 animate-pulse">
              <div className="w-20 h-20 rounded-full bg-slate-200" />
              <div className="h-4 w-32 bg-slate-200 rounded-full" />
              <div className="h-3 w-24 bg-slate-100 rounded-full" />
              <div className="h-3 w-40 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-600">
          {String(error)}
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <p className="text-slate-700 font-medium">No employees found</p>
          <p className="text-slate-400 text-sm mt-1">There are no employees in this department yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((row) => {
          const id = (row.employee_id || row.employeeId || row.id || "").trim();
          const avatarRaw =
            row.profile || row.profile_picture || row.avatar || null;
          const avatarSrc = avatarRaw
            ? avatarRaw.startsWith("data:")
              ? avatarRaw
              : `data:image/jpeg;base64,${avatarRaw.trim()}`
            : null;

          const initials = (row.name || "?")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={id || row.email}
              onClick={() =>
                id && navigate(`/employees/${dept}/${encodeURIComponent(id)}`)
              }
              className="group bg-white rounded-2xl shadow-sm hover:shadow-lg border border-slate-100 hover:border-[#FF5800]/30 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              {/* Top accent */}
              <div className="h-1 bg-gradient-to-r from-[#FF5800] to-[#ff8c42]" />

              <div className="p-6 flex flex-col items-center text-center">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={row.name}
                    className="w-20 h-20 rounded-full object-cover mb-4 ring-4 ring-[#FF5800]/20 group-hover:ring-[#FF5800]/40 transition-all"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full mb-4 ring-4 ring-[#FF5800]/20 group-hover:ring-[#FF5800]/40 transition-all bg-gradient-to-br from-[#0e1b34] to-[#223366] flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{initials}</span>
                  </div>
                )}

                <h2 className="text-base font-bold text-[#0e1b34] w-full break-words leading-snug">
                  {row.name}
                </h2>
                {(row.designation || row.role || row.department) && (
                  <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-[#FF5800]/10 text-[#FF5800] text-xs font-semibold w-full break-words">
                    {row.designation || row.role || row.department}
                  </span>
                )}
                <p className="text-xs text-slate-400 mt-2 w-full break-all">{row.email}</p>

                <div className="mt-4 w-full pt-3 border-t border-slate-100 text-xs text-slate-400 group-hover:text-[#FF5800] transition-colors font-medium">
                  View Profile →
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
