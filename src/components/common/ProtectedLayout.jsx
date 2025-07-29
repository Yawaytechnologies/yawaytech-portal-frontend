// src/components/common/ProtectedLayout.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-background min-h-screen flex text-text-primary">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Topbar toggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 bg-surface overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
