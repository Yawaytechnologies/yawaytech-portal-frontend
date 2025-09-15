import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import EmployeeSidebar from "../components/EmployeeSide/Sidebar.jsx";
import EmployeeHeader from "../components/EmployeeSide/Header.jsx";
const MOCK_USER = { name: "Sowjanya", avatar: "/images/employee-avatar.png" };

export default function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const onLogout = () => console.log("Logout clicked");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <EmployeeSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={MOCK_USER}
      />
      <div className="md:ml-72 flex flex-col min-h-screen">
        <EmployeeHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          user={MOCK_USER}
          onLogout={onLogout}
        />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}