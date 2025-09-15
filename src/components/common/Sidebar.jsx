import { FaHome } from "react-icons/fa";
import { RiFileAddLine } from "react-icons/ri";
import { MdPeople,MdAccessTime } from "react-icons/md";
import { IoChevronDownSharp } from "react-icons/io5";
import { NavLink, Link } from "react-router-dom";
import React, { useState } from "react";

export default function Sidebar({ isOpen }) {
  const [hovered, setHovered] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showAttendanceDropdown, setShowAttendanceDropdown] = useState(false); // NEW

  const employeeRoles = [
    { label: "HR", path: "/employees/hr" },
    { label: "Software Developer", path: "/employees/developer" },
    { label: "Digital Creator", path: "/employees/creator" },
  ];

  const attendanceRoles = [
    { label: "HR", path: "/attendance/hr" },
    { label: "Software Developer", path: "/attendance/developer" },
    { label: "Digital Creator", path: "/attendance/creator" },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 w-64 h-full bg-gradient-to-b from-[#0e1b34] via-[#18234b] to-[#223366] text-white p-6 caret-transparent shadow-xl transition-transform duration-300 md:static md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } overflow-hidden`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-col h-full relative group">
        <div className={`absolute h-[5em] w-[5em] -top-[2.5em] -left-[2.5em] rounded-full bg-[#FF5800] z-[-1] transition-transform duration-500 ${
          hovered ? "scale-[800%]" : "scale-0"
        }`} />

        <div className="w-fit mb-8">
          <Link to="/" className="block">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide font-sans drop-shadow-md">
              Yaway <span className="text-[--accent]">Tech</span> Portal
            </h2>
          </Link>
        </div>

        <nav className="flex-1 space-y-3">
          <NavLink to="/dashboard" className={navClass(hovered)}>
            <FaHome /><span>Dashboard</span>
          </NavLink>

          <NavLink to="/add-expense" className={navClass(hovered)}>
            <RiFileAddLine /><span>Track Expense</span>
          </NavLink>

          {/* Employees Profile */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setShowEmployeeDropdown((v) => !v);
                setShowAttendanceDropdown(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-md font-medium transition ${
                hovered ? "bg-accent text-black" : "text-white hover:bg-primary-light hover:text-black"
              }`}
            >
              <span className="flex items-center gap-2">
                <MdPeople /> Employees Profile
              </span>
              <IoChevronDownSharp className={`${showEmployeeDropdown ? "rotate-180" : ""} transition`} />
            </button>

            {showEmployeeDropdown && (
              <div className="ml-6 space-y-2">
                {employeeRoles.map((role) => (
                  <NavLink key={role.label} to={role.path}
                    className={({ isActive }) =>
                      `block px-3 py-1 rounded-md text-sm transition ${
                        isActive
                          ? hovered ? "bg-accent text-black" : "bg-accent text-[#FF5800]"
                          : "text-white hover:bg-primary-light hover:text-black"
                      }`}>
                    {role.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Employees Attendance */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setShowAttendanceDropdown((v) => !v);
                setShowEmployeeDropdown(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-md font-medium transition ${
                hovered ? "bg-accent text-black" : "text-white hover:bg-primary-light hover:text-black"
              }`}
            >
              <span className="flex items-center gap-2 whitespace-nowrap"><MdAccessTime className="shrink-0" /> Employees Attendance</span>

              <IoChevronDownSharp className={`transition-transform duration-200 ${showAttendanceDropdown ? "rotate-180" : ""}`} />

            </button>

            {showAttendanceDropdown && (
              <div className="ml-6 space-y-2">
                {attendanceRoles.map((role) => (
                  <NavLink key={role.label} to={role.path}
                    className={({ isActive }) =>
                      `block px-3 py-1 rounded-md text-sm transition ${
                        isActive
                          ? hovered ? "bg-accent text-black" : "bg-accent text-[#FF5800]"
                          : "text-white hover:bg-primary-light hover:text-black"
                      }`}>
                    {role.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );

  function navClass(hovered) {
    return ({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-md transition font-medium ${
        isActive
          ? hovered ? "bg-accent text-black" : "bg-accent text-[#FF5800]"
          : "text-white hover:text-black hover:bg-primary-light"
      }`;
  }
}
