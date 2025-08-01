import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { RiFileAddLine } from "react-icons/ri";
import { Link } from "react-router-dom";


export default function Sidebar({ isOpen }) {
  const [hovered, setHovered] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 z-40 w-64 h-full bg-gradient-to-b from-[#0e1b34] via-[#18234b] to-[#223366] text-white p-6 shadow-xl transition-transform duration-300 md:static md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } overflow-hidden`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-col h-full relative group">
        {/* Bubble Animation Effect (triggered by entire sidebar hover) */}
        <div
          className={`absolute h-[5em] w-[5em] -top-[2.5em] -left-[2.5em] rounded-full bg-[#FF5800] z-[-1] transition-transform duration-500 ${
            hovered ? "scale-[800%]" : "scale-0"
          }`}
        ></div>

        {/* Logo */}
<div className="w-fit mb-8">
  <Link to="/" className="block">
    <h2 className="z-20 text-2xl md:text-3xl font-bold text-white tracking-wide sans-serif font-Playfair drop-shadow-md transition-colors duration-500 font-sans">
      Yaway <span className="text-[var(--secondary)]">Tech</span> Portal
    </h2>
  </Link>
</div>


        {/* Navigation */}
        <nav className="flex-1 space-y-3">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition font-medium ${
                isActive
                  ? hovered
                    ? "bg-accent text-black"
                    : "bg-accent text-[#FF5800]"
                  : "text-white hover:text-black hover:bg-primary-light"
              }`
            }
          >
            <FaHome />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/add-expense"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition font-medium ${
                isActive
                  ? hovered
                    ? "bg-accent text-black"
                    : "bg-accent text-[#FF5800]"
                  : "text-white hover:text-black hover:bg-primary-light"
              }`
            }
          >
            <RiFileAddLine />
            <span>Track Expense</span>
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
