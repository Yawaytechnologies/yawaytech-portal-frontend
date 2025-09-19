import React, { useState, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import EmployeeSidebar from "../components/EmployeeSide/Sidebar.jsx";
import EmployeeHeader from "../components/EmployeeSide/Header.jsx";

export default function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((s) => s.auth || {});

  // Pull an ID (like YTP001 / EMP102367) from your auth/user object
  const userId = useMemo(() => {
    return (
      user?.employee_id ||
      user?.employeeId ||
      user?.employee?.employee_id ||
      user?.code ||
      user?.id ||
      ""
    );
  }, [user]);

  const onLogout = () => console.log("Logout clicked");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <EmployeeSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brandTitle="Yaway Tech Portal"
      />
      <div className="md:ml-72 flex flex-col min-h-screen">
        <EmployeeHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          onLogout={onLogout}
          userId={userId}
        />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
