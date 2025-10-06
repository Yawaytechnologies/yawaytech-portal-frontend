// src/components/layout/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { RiFileAddLine, RiUserAddLine } from "react-icons/ri";
import { MdPeople, MdAccessTime } from "react-icons/md";
import { IoChevronDownSharp } from "react-icons/io5";

export default function Sidebar({ isOpen }) {
  const [open, setOpen] = useState({
    employee: false,
    attendance: false,
    
  });
  const location = useLocation();

  // collapse any open dropdown on route change
  useEffect(() => {
    setOpen({ employee: false, attendance: false, worklog: false });
  }, [location.pathname, location.search]);

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

  

  const toggle = (key) =>
    setOpen((p) => ({
      employee: false,
      attendance: false,
      worklog: false,
      [key]: !p[key],
    }));

  return (
    <aside
      className={`fixed top-0 left-0 z-40 w-64 h-full bg-gradient-to-b from-[#0e1b34] via-[#18234b] to-[#223366] text-white p-6 shadow-xl transition-transform duration-300 md:static md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="mb-8 w-fit">
          <Link to="/" className="block focus:outline-none focus:ring-2 focus:ring-white/50 rounded">
            <h2 className="font-sans text-2xl font-bold tracking-wide text-white drop-shadow-md md:text-3xl">
              Yaway <span className="text-[--accent]">Tech</span> Portal
            </h2>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-3 overflow-y-auto pr-1">
          <NavLink to="/dashboard" className={navClass}>
            <FaHome /> <span>Dashboard</span>
          </NavLink>

          <NavLink to="/add-expense" className={navClass}>
            <RiFileAddLine /> <span>Track Expense</span>
          </NavLink>

          {/* New Employee */}
          <NavLink to="/employee/new" state={{ title: "New Employee" }} className={navClass}>
            <RiUserAddLine /> <span>New Employee</span>
          </NavLink>

          {/* Employees Profile */}
          <div className="space-y-1">
            <button
              onClick={() => toggle("employee")}
              aria-expanded={open.employee}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 font-medium text-white transition hover:bg-primary-light hover:text-black"
            >
              <span className="flex items-center gap-2">
                <MdPeople /> Employees Profile
              </span>
              <IoChevronDownSharp
                className={`transition-transform duration-200 ${open.employee ? "rotate-180" : ""}`}
              />
            </button>

            {open.employee && (
              <div className="ml-6 space-y-2">
                {employeeRoles.map((role) => (
                  <NavLink
                    key={role.label}
                    to={role.path}
                    state={{ title: `${role.label} Profiles` }}
                    className={subNavClass}
                  >
                    {role.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Employees Attendance */}
          <div className="space-y-1">
            <button
              onClick={() => toggle("attendance")}
              aria-expanded={open.attendance}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 font-medium text-white transition hover:bg-primary-light hover:text-black"
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <MdAccessTime className="shrink-0" /> Employees Attendance
              </span>
              <IoChevronDownSharp
                className={`transition-transform duration-200 ${open.attendance ? "rotate-180" : ""}`}
              />
            </button>

            {open.attendance && (
              <div className="ml-6 space-y-2">
                {attendanceRoles.map((role) => (
                  <NavLink
                    key={role.label}
                    to={role.path}
                    state={{ title: `${role.label} Attendance` }}
                    className={subNavClass}
                  >
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

  function navClass({ isActive }) {
    return `flex items-center gap-3 rounded-md px-3 py-2 font-medium transition ${
      isActive ? "bg-accent text-[#FF5800]" : "text-white hover:bg-primary-light hover:text-black"
    }`;
  }

  function subNavClass({ isActive }) {
    return `block rounded-md px-3 py-1 text-sm transition ${
      isActive ? "bg-accent text-[#FF5800]" : "text-white hover:bg-primary-light hover:text-black"
    }`;
  }
}
