import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchDigitalCreators } from "../../redux/actions/digitalCreatorActions";

const Avatar = ({ src, alt }) => (
  <img
    src={src || "https://i.pravatar.cc/150?img=1"}
    alt={alt || "profile"}
    className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#FF5800]"
    onError={(e) => { e.currentTarget.src = "https://i.pravatar.cc/150?img=2"; }}
  />
);

export default function DigitalCreator() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { creators, loading, error } = useSelector((s) => s.digitalCreator);

  useEffect(() => {
    dispatch(fetchDigitalCreators());
  }, [dispatch]);

  const list = Array.isArray(creators) ? creators : [];

  return (
    <div className="p-6 bg-[#f4f6fa] min-h-screen caret-transparent">
      <h1 className="text-3xl font-bold mb-8 text-[#223366]">Digital Creators</h1>

      {loading && <p>Loading creator data...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && list.length === 0 && (
        <p className="text-gray-500">No creators found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((c) => {
          const id = (c?.employee_id || c?.employeeId || "").trim();
          return (
            <div
              key={id || c.email}
              onClick={() => id && navigate(`/employees/creator/${id}`)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer p-6 flex flex-col items-center text-center border-t-4 border-[#FF5800]">
              <Avatar src={c.profile} alt={c.name} />
              <h2 className="text-xl font-semibold text-[#0e1b34]">{c.name}</h2>
              <p className="text-sm text-gray-600">{c.designation || "—"}</p>
              <p className="text-sm text-gray-500">{c.email}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
