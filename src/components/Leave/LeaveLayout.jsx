import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/leave/apply", label: "Apply" },
  { to: "/leave/requests", label: "My Requests" },
  { to: "/leave/approvals", label: "Approvals" },
  { to: "/leave/policies", label: "Policies" },
  { to: "/leave/balances", label: "Balances" },
];

export default function LeaveLayout() {
  return (
    <div className="container py-6 grid gap-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-2 flex flex-wrap gap-2">
        {tabs.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({isActive}) =>
              `px-3 py-1.5 rounded-lg text-sm ${isActive ? "bg-white text-black" : "hover:bg-white/10"}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
