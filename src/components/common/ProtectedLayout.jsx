import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  const path = useMemo(() => {
    if (pathname !== "/" && pathname.endsWith("/")) return pathname.slice(0, -1);
    return pathname;
  }, [pathname]);

  const pageTitle = useMemo(() => {
    const exact = {
      "/": "Dashboard",
      "/dashboard": "Dashboard",
      "/add-expense": "Track Expense",
      "/employees/hr": "Employees • HR",
      "/employees/developer": "Employees • Software Developers",
      "/employees/creator": "Employees • Digital Creators",
      "/attendance/hr": "Attendance • HR",
      "/attendance/developer": "Attendance • Developers",
      "/attendance/creator": "Attendance • Digital Creators",
    };
    if (exact[path]) return exact[path];

    const m1 = path.match(/^\/employees\/hr\/([^/]+)$/);
    if (m1) return `Employee • HR • ${m1[1]}`;
    const m2 = path.match(/^\/employees\/developer\/([^/]+)$/);
    if (m2) return `Employee • Developer • ${m2[1]}`;
    const m3 = path.match(/^\/employees\/creator\/([^/]+)$/);
    if (m3) return `Employee • Creator • ${m3[1]}`;

    const m4 = path.match(/^\/employees\/([^/]+)$/);
    if (m4) return `Employee Profile • ${m4[1]}`;

    const a1 = path.match(/^\/attendance\/hr\/([^/]+)$/);
    if (a1) return `Attendance • HR • ${a1[1]}`;
    const a2 = path.match(/^\/attendance\/developer\/([^/]+)$/);
    if (a2) return `Attendance • Developer • ${a2[1]}`;
    const a3 = path.match(/^\/attendance\/creator\/([^/]+)$/);
    if (a3) return `Attendance • Creator • ${a3[1]}`;

    return "Yaway Tech Portal";
  }, [path]);

  useEffect(() => {
    const base = "Yaway Tech Portal";
    document.title = pageTitle === base ? base : `${pageTitle} | ${base}`;
  }, [pageTitle]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [sidebarOpen]);

  const onEsc = useCallback((e) => {
    if (e.key === "Escape") setSidebarOpen(false);
  }, []);
  useEffect(() => {
    if (!sidebarOpen) return;
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [sidebarOpen, onEsc]);

  useEffect(() => {
  if (sidebarOpen) setSidebarOpen(false);
}, [path, sidebarOpen]);


  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden relative">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 md:hidden bg-black/40 backdrop-blur-[1px]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden z-0">
        <Topbar title={pageTitle} toggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 bg-surface overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
