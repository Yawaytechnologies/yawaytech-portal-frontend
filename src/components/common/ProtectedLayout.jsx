import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet, useLocation } from "react-router-dom";

export default function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Decide the title based on current route
  let pageTitle = "Yaway Tech Portal";
  if (location.pathname === "/") {
    pageTitle = "Dashboard";
  } else if (location.pathname === "/add-expense") {
    pageTitle = "Track Expense";
  }

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden relative">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
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
