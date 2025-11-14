// src/components/employee/Department.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadDepartmentEmployees } from "../../redux/actions/departmentActions";

const TITLE = {
  hr: "HR Employees",
  developer: "Software Developers",
  marketing: "Marketing Employees",
  finance: "Finance Employees",
  sales: "Sales Employees",
};

export default function DepartmentAttendance({ dept = "hr" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items = [], loading, error } = useSelector(
    (s) => s.department || {}
  );

  useEffect(() => {
    dispatch(loadDepartmentEmployees({ routeDept: dept, limit: 50, offset: 0 }));
  }, [dispatch, dept]);

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
          const avatar =
            row.profile || row.profile_picture || row.avatar || null;

          return (
           <div
              key={id || Math.random()}
              onClick={() => id && navigate(`/attendance/department/${dept}/${encodeURIComponent(id)}`)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer p-6 flex flex-col items-center text-center border-t-4 border-[#FF5800]"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={row.name}
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#FF5800]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 mb-4 border-2 border-[#FF5800] flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}

              <h2 className="text-xl font-semibold text-[#0e1b34]">{row.name}</h2>
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
