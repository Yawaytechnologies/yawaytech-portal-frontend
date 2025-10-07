// src/employee/HREmployees.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchHREmployees } from "../../redux/actions/hrActions";

export default function HREmployees() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { employees, loading, error } = useSelector((s) => s.hr);

  useEffect(() => {
    dispatch(fetchHREmployees());
  }, [dispatch]);

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-[#223366]">HR Employees</h1>

      {loading && <p>Loading HR employees...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((hr) => {
          const id = (hr?.employeeId || "").trim();
          return (
            <div
              key={id || hr.email}
              onClick={() => id && navigate(`/employees/hr/${id}`)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer p-6 flex flex-col items-center text-center border-t-4 border-[#FF5800]"
            >
              {hr.profile ? (
                <img
                  src={hr.profile}
                  alt={hr.name}
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#FF5800]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 mb-4 border-2 border-[#FF5800] flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
              <h2 className="text-xl font-semibold text-[#0e1b34]">{hr.name}</h2>
              <p className="text-sm text-gray-600">{hr.role}</p>
              <p className="text-sm text-gray-500">{hr.email}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
