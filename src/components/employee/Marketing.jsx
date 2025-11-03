// src/components/employee/MarketingEmployees.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchMarketingEmployees } from "../../redux/actions/marketingActions";

export default function MarketingEmployees() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { employees = [], loading, error } = useSelector((s) => s.marketing || {});

  useEffect(() => {
    dispatch(fetchMarketingEmployees());
  }, [dispatch]);

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-[#223366]">Marketing Employees</h1>

      {loading && <p>Loading Marketing employees...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => {
          const id = (emp?.employeeId || "").trim();
          return (
            <div
              key={id || emp.email}
              onClick={() => id && navigate(`/employees/marketing/${id}`)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer p-6 flex flex-col items-center text-center border-t-4 border-[#FF5800]"
            >
              {emp.profile ? (
                <img
                  src={emp.profile}
                  alt={emp.name}
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#FF5800]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 mb-4 border-2 border-[#FF5800] flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
              <h2 className="text-xl font-semibold text-[#0e1b34]">{emp.name}</h2>
              <p className="text-sm text-gray-600">{emp.role || emp.designation}</p>
              <p className="text-sm text-gray-500">{emp.email}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
