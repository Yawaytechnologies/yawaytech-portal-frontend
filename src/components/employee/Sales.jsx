// src/components/employee/SalesEmployees.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchSalesEmployees } from "../../redux/actions/salesActions";

export default function SalesEmployees() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { employees = [], loading, error } = useSelector((s) => s.sales || {});

  useEffect(() => {
    dispatch(fetchSalesEmployees());
  }, [dispatch]);

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-[#223366]">Sales Employees</h1>

      {loading && <p>Loading Sales employees...</p>}
      {error && <p className="text-red-500">{String(error)}</p>}

      {!loading && !error && employees.length === 0 && (
        <p className="text-gray-600">No Sales employees found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp, idx) => {
          const id = `${emp?.employeeId ?? ""}`.trim();
          const key = id || emp?.email || idx;
          return (
            <div
              key={key}
              onClick={() => id && navigate(`/employees/sales/${id}`)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer p-6 flex flex-col items-center text-center border-t-4 border-[#FF5800]"
            >
              {emp?.profile ? (
                <img
                  src={emp.profile}
                  alt={emp?.name || "Employee"}
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#FF5800]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 mb-4 border-2 border-[#FF5800] flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No Image</span>
                </div>
              )}
              <h2 className="text-xl font-semibold text-[#0e1b34]">{emp?.name || "—"}</h2>
              <p className="text-sm text-gray-600">{emp?.role || emp?.designation || "—"}</p>
              <p className="text-sm text-gray-500">{emp?.email || "—"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
