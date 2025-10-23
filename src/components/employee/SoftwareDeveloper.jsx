import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchSoftwareDevelopers } from "../../redux/reducer/softwareDevSlice";

export default function SoftwareDeveloper() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { developers, loading, error } = useSelector((s) => s.softwareDev);

  useEffect(() => {
    dispatch(fetchSoftwareDevelopers());
  }, [dispatch]);

  if (loading) return <p className="p-6">Loading developer data...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!developers.length) return <p className="p-6">No developers found.</p>;

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen caret-transparent">
      <h1 className="text-3xl font-bold mb-8 text-[#223366]">Software Developers</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {developers.map((dev) => {
          const id = (dev?.employeeId || "").trim();
          return (
            <div
              key={id || dev.email}
              onClick={() => id && navigate(`/employees/developer/${id}`)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer p-6 flex flex-col items-center text-center border-t-4 border-[#FF5800]"
            >
              {dev.profile ? (
                <img
                  src={dev.profile}
                  alt={dev.name}
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#FF5800]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full mb-4 border-2 border-[#FF5800] bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No Image</span>
                </div>
              )}
              <h2 className="text-xl font-semibold text-[#0e1b34]">{dev.name}</h2>
              <p className="text-sm text-gray-600">{dev.role}</p>
              <p className="text-sm text-gray-500">{dev.email}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
