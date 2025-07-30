import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden relative">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
        {sidebarOpen && (
        <div
          className="fixed inset-0 z-30  md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-0">
        <Topbar toggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 bg-surface overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
