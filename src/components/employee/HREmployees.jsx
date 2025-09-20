// src/components/EmployeeOverview/HREmployees.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchHREmployees } from "../../redux/actions/hrActions";

export default function HREmployees() {
  const dispatch = useDispatch();
  const { employees, loading, error } = useSelector((s) => s.hr);

  useEffect(() => {
    dispatch(fetchHREmployees());
  }, [dispatch]);

  const list = Array.isArray(employees) ? employees : [];

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen caret-transparent">
      <h1 className="text-3xl font-bold mb-8 text-[#223366]">HR Team</h1>

      {loading && <p>Loading HR data...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && list.length === 0 && <p>No employees found.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((emp) => {
          // 👇 IMPORTANT: prefer employee_id from backend
          const id = (emp.employee_id || emp.employeeId || emp.id || "").toString().trim();
          const key = id || emp.email;
          const avatar = emp.profile || `https://i.pravatar.cc/150?u=${id || emp.email || "x"}`;

          const card = (
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col items-center text-center border-t-4 border-[#FF5800]">
              <img
                src={avatar}
                alt={emp.name}
                className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#FF5800]"
              />
              <h2 className="text-xl font-semibold text-[#0e1b34]">{emp.name}</h2>
              <p className="text-sm text-gray-600">{emp.role || emp.designation}</p>
              <p className="text-sm text-gray-500">{emp.email}</p>
            </div>
          );

          return id ? (
            // 👇 Route param name must match your App.jsx route (employeeId)
            <Link key={key} to={`/employees/hr/${encodeURIComponent(id)}`} className="block">
              {card}
            </Link>
          ) : (
            <div key={key} className="opacity-70 cursor-not-allowed">{card}</div>
          );
        })}
      </div>
    </div>
  );
}
