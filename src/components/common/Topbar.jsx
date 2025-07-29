// src/components/common/Topbar.jsx
import React from "react";
import { HiMenu } from "react-icons/hi";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";

export default function Topbar({ toggleSidebar }) {
  return (
    <header className="bg-primary shadow-md h-16 px-4 flex items-center justify-between">
      {/* Hamburger - always visible */}
      <button onClick={toggleSidebar} className="text-2xl text-primary block md:hidden">
        <HiMenu />
      </button>

      {/* Admin Info */}
      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-2">
          <FaUserCircle className="text-xl text-primary" />
          <span className="text-sm font-medium text-text-secondary">Admin</span>
        </div>
        <button
          className="flex items-center gap-2 text-danger hover:text-red-600 text-sm font-medium"
          onClick={() => console.log("Logout logic here")}
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </header>
  );
}
