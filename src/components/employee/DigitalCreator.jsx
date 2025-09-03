import React, { useState } from "react";

const creators = [
  {
    id: 1,
    name: "Velli muthu",
    role: "Content Strategist",
    email: "priya@yawaytech.com",
    phone: "9876543212",
    overview: "Leads content planning and brand storytelling across platforms.",
  },
  {
    id: 2,
    name: "Thanga muthu",
    role: "Video Editor",
    email: "rohan@yawaytech.com",
    phone: "9123456782",
    overview: "Creates and edits promotional and training videos for campaigns.",
  },
];

export default function DigitalCreator() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-[#223366]">Digital Creators</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {creators.map((creator) => (
          <div
            key={creator.id}
            onClick={() => setSelectedEmployee(creator)}
            className="bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-xl transition"
          >
            <h2 className="text-xl font-semibold text-[#0e1b34]">{creator.name}</h2>
            <p className="text-sm text-gray-600">{creator.role}</p>
            <p className="text-sm text-gray-500">{creator.email}</p>
          </div>
        ))}
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold text-[#0e1b34] mb-2">
              {selectedEmployee.name}
            </h2>
            <p className="text-sm text-gray-700 mb-1">
              <strong>Role:</strong> {selectedEmployee.role}
            </p>
            <p className="text-sm text-gray-700 mb-1">
              <strong>Email:</strong> {selectedEmployee.email}
            </p>
            <p className="text-sm text-gray-700 mb-1">
              <strong>Phone:</strong> {selectedEmployee.phone}
            </p>
            <p className="text-sm text-gray-700 mb-4">
              <strong>Overview:</strong> {selectedEmployee.overview}
            </p>
            <button
              onClick={() => setSelectedEmployee(null)}
              className="bg-[#FF5800] text-white px-4 py-2 rounded hover:bg-[#e04e00]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
