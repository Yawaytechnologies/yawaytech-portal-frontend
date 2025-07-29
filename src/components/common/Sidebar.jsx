// src/components/common/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaPlusCircle } from "react-icons/fa";

export default function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <aside
  className={`fixed top-0 left-0 z-40 w-64 h-full bg-primary text-white p-6 shadow-xl transition-transform duration-300 md:static md:translate-x-0 ${
    isOpen ? "translate-x-0" : "-translate-x-full"
  } overflow-hidden`}
  style={{
    backgroundColor: "var(--primary)", // force fallback in case Tailwind fails
    color: "white",                     // override if variable fails
  }}
>

      <div className="flex flex-col h-full">
        <h2 className="text-2xl font-bold mb-8">Expense Tracker</h2>

        <nav className="flex-1 space-y-3">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                isActive ? "bg-accent text-black font-semibold" : "hover:bg-primary-light"
              }`
            }
          >
            <FaHome />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/add-expense"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                isActive ? "bg-accent text-black font-semibold" : "hover:bg-primary-light"
              }`
            }
          >
            <FaPlusCircle />
            <span>Add Expense</span>
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
