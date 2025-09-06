import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchDigitalCreators } from "../../redux/actions/digitalCreatorActions";

export default function DigitalCreator() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { creators, loading, error } = useSelector((s) => s.digitalCreator);

  useEffect(() => {
    dispatch(fetchDigitalCreators());
  }, [dispatch]);

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-[#223366]">Digital Creators</h1>

      {loading && <p>Loading creator data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.map((c) => {
          const id = (c?.employeeId || "").trim();
          return (
            <div
              key={id || c.email}
              onClick={() => id && navigate(`/attendance/creator/${id}`)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer p-6 flex flex-col items-center text-center border-t-4 border-[#FF5800]">
              <img
                src={c.profile}
                alt={c.name}
                className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#FF5800]"/>
              <h2 className="text-xl font-semibold text-[#0e1b34]">{c.name}</h2>
              <p className="text-sm text-gray-600">{c.role}</p>
              <p className="text-sm text-gray-500">{c.email}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
