import React, { useState } from "react";

const developers = [
  {
    id: 1,
    name: "Santhosh",
    role: "Frontend Developer",
    email: "Santhosh@yawaytech.com",
    phone: "9876543211",
    overview: "Specializes in React, UI/UX design, and performance optimization.",
  },
  {
    id: 2,
    name: "Praveen",
    role: "Backend Developer",
    email: "Praveen@yawaytech.com",
    phone: "9123456781",
    overview: "Manages APIs, databases, and server-side architecture.",
  },
];

export default function SoftwareDeveloper() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-[#223366]">Software Developers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {developers.map((dev) => (
          <div
            key={dev.id}
            onClick={() => setSelectedEmployee(dev)}
            className="bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-xl transition"
          >
            <h2 className="text-xl font-semibold text-[#0e1b34]">{dev.name}</h2>
            <p className="text-sm text-gray-600">{dev.role}</p>
            <p className="text-sm text-gray-500">{dev.email}</p>
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
