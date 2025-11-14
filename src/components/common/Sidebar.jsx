import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { RiFileAddLine, RiUserAddLine } from "react-icons/ri";
import { MdPeople, MdAccessTime } from "react-icons/md";
import { IoChevronDownSharp, IoCloseSharp } from "react-icons/io5";

const ACCENT = "var(--accent, #FF5800)";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [open, setOpen] = useState({ employee: false, attendance: false });

  useEffect(() => {
    const p = location.pathname.toLowerCase();
    setOpen({
      employee: p.startsWith("/employees"),
      attendance: p.startsWith("/attendance"),
    });
  }, [location.pathname]);

  const employeeRoles = useMemo(
    () => [
      { label: "HR", path: "/employees/hr" },
      { label: "Software Developer", path: "/employees/developer" },
      { label: "Marketing", path:"/employees/marketing" },
      { label: "Finance", path:"/employees/finance" },
      { label: "Sales", path:"/employees/sales" },  
    ],
    []
  );

  const attendanceRoles = useMemo(
    () => [
      { label: "HR", path: "/attendance/hr" },
      { label: "Software Developer", path: "/attendance/developer" },
      { label: "Marketing", path:"/attendance/marketing" },
      { label: "Finance", path:"/attendance/finance" },
      { label: "Sales", path:"/attendance/sales" },
    ],
    []
  );

  const toggle = (key) => setOpen((p) => ({ ...p, [key]: !p[key] }));

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-full w-72 text-white
                  bg-gradient-to-b from-[#0e1b34] via-[#18234b] to-[#223366]
                  shadow-xl transition-transform duration-300 md:static md:translate-x-0
                  ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      aria-label="Sidebar"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-full flex-col">
        {/* Brand + X close (mobile) */}
        <div className="px-6 pt-5 pb-4 border-b border-white/10 relative">
          <Link
            to="/"
            className="inline-block rounded outline-none ring-0 focus-visible:ring-2 focus-visible:ring-white/50"
            onClick={() => onClose?.()}
          >
            <h2 className="font-sans text-xl md:text-3xl font-extrabold tracking-wide text-white drop-shadow">
              Yaway <span style={{ color: "#FF5800" }}>Tech</span> Portal
            </h2>
          </Link>

          {/* X button (only on mobile) */}
          <button
            type="button"
            aria-label="Close sidebar"
            className="md:hidden absolute right-3 top-4 inline-flex h-9 w-9 items-center justify-center
                       rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 transition"
            onClick={() => onClose?.()}
          >
            <IoCloseSharp className="text-xl" />
          </button>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 overflow-y-auto px-2 py-4 pr-3"
          style={{ scrollbarWidth: "thin" }}
        >
          <SideLink to="/dashboard" icon={<FaHome />} onNav={() => onClose?.()}>
            Dashboard
          </SideLink>

          <SideLink to="/add-expense" icon={<RiFileAddLine />} onNav={() => onClose?.()}>
            Track Expense
          </SideLink>

          <SideLink
            to="/employee/new"
            icon={<RiUserAddLine />}
            state={{ title: "New Employee" }}
            onNav={() => onClose?.()}
          >
            New Employee
          </SideLink>

          <div className="mt-0">
            <Accordion
              icon={<MdPeople />}
              title="Employees Profile"
              open={open.employee}
              onToggle={() => toggle("employee")}
            >
              {employeeRoles.map((r) => (
                <SubLink key={r.path} to={r.path} state={{ title: `${r.label} Profiles` }} onNav={() => onClose?.()}>
                  {r.label}
                </SubLink>
              ))}
            </Accordion>

            <Accordion
              icon={<MdAccessTime />}
              title="Employees Attendance"
              open={open.attendance}
              onToggle={() => toggle("attendance")}
            >
              {attendanceRoles.map((r) => (
                <SubLink key={r.path} to={r.path} state={{ title: `${r.label} Attendance` }} onNav={() => onClose?.()}>
                  {r.label}
                </SubLink>
              ))}
            </Accordion>
          </div>
        </nav>
      </div>
    </aside>
  );
}

/* ---------- Small UI helpers ---------- */

function SideLink({ to, icon, children, state, onNav }) {
  return (
    <NavLink
      to={to}
      state={state}
      onClick={onNav}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-white/10 text-white ring-1 ring-white/15"
            : "text-white/90 hover:text-white hover:bg-white/5",
          "relative",
        ].join(" ")
      }
    >
      <ActiveRail />
      <span className="text-base shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </NavLink>
  );
}

function SubLink({ to, children, state, onNav }) {
  return (
    <NavLink
      to={to}
      state={state}
      onClick={onNav}
      className={({ isActive }) =>
        [
          "block rounded-md pl-9 pr-3 py-2 text-[13px] transition-colors",
          isActive
            ? "bg-white/10 text-[#FF5800]" 
            : "text-white/80 hover:text-white hover:bg-white/5",
          "relative",
        ].join(" ")
      }
    >
      <ActiveRail small />
      {children}
    </NavLink>
  );
}

function Accordion({ icon, title, open, onToggle, children }) {
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold
                   text-white/95 hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-3">
          <span className="text-base">{icon}</span>
          <span className="truncate">{title}</span>
        </span>
        <IoChevronDownSharp
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="py-1">{children}</div>
      </div>
    </div>
  );
}

function ActiveRail({ small = false }) {
  return (
    <span
      className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r
        ${small ? "h-4" : "h-5"} w-1
        bg-[#FF5800]
        opacity-0 group-[.active]:opacity-100`}
      aria-hidden
    />
  );
}
