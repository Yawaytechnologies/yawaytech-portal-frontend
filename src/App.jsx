// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useSelector } from "react-redux";
import EmployeeAttendancePage from "../src/components/EmployeeSide/EmployeeAttendance.jsx";
import ProtectedLayout from "./components/common/ProtectedLayout";
import DashboardPage from "./pages/DashboardPage.jsx";
import AddExpensePage from "./pages/AddExpensePage.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import EmployeeLogin from "./pages/EmployeeLogin.jsx";
import EmployeeLayout from "./pages/EmployeeLayout.jsx"; 
import Employees from "./pages/EmployeePage.jsx";
import Attendance from "./Pages/AttendancePage.jsx"
import HRDetail from "./components/EmployeeOverview/HrOverview.jsx";
import SoftwareDeveloperOverview from "./components/EmployeeOverview/SoftwareDeveloperOverview.jsx";
import DigitalCreatorOverview from "./components/EmployeeOverview/DigitalCreatorOverview.jsx";

import HrEmployeeOverview from "./components/AttendanceOverview/HREmployeesOverview.jsx";

import DeveloperAttendanceOverview from "./components/AttendanceOverview/DeveloperAttendanceOverview.jsx";
import DigitalCreatorAttendanceOverview from "./components/AttendanceOverview/DigitalCreatorAttendanceOverview.jsx";



// ---------- Guards ----------
function RequireAuth({ roles }) {
  const { token, user } = useSelector((s) => s.auth || {});
  // require authentication for ALL protected routes
  if (!token) return <Navigate to="/admin-login" replace />;
  // enforce role if provided
  if (roles?.length && !roles.includes(user?.role)) {
    return (
      <Navigate
        to={user?.role === "employee" ? "/employee-login" : "/admin-login"}
        replace
      />
    );
  }
  return <Outlet />;
}

// Choose the *shell* (topbar/sidebar) per role:
// - Admins: use ProtectedLayout (admin shell)
// - Employees: no shell (blank)
function ShellSwitch() {
  const { user } = useSelector((s) => s.auth || {});
  if (user?.role === "employee") return <Outlet />;     // no shell
  return <ProtectedLayout />;                            // admin shell
}

// Choose the *page content* per role for / and /dashboard
function RoleDashboardSwitch() {
  const { user } = useSelector((s) => s.auth || {});
  return user?.role === "employee" ? <EmployeeLayout /> : <DashboardPage />;
}

// ---------- App ----------
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public login routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />

        {/* Protected area for BOTH roles */}
        <Route element={<RequireAuth roles={["admin", "employee"]} />}>
          {/* Shell chosen by role (admin gets top/side; employee gets none) */}
          <Route element={<ShellSwitch />}>
            <Route index element={<RoleDashboardSwitch />} />
            <Route path="/dashboard" element={<RoleDashboardSwitch />} />
          </Route>
        </Route>

        {/* Admin-only protected routes (always with admin shell) */}
        <Route element={<RequireAuth roles={["admin"]} />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/add-expense" element={<AddExpensePage />} />
              {/* Employee Views */}
        <Route path="employees/hr" element={<Employees role="hr" />} />
        <Route path="employees/developer" element={<Employees role="softwaredeveloper" />} />
        <Route path="employees/creator" element={<Employees role="digitalcreator" />} />
          {/* Employee Overview */}
          <Route path="employees/hr/:employeeId" element={<HRDetail />} />
          <Route path="employees/developer/:employeeId" element={<SoftwareDeveloperOverview />} />
          <Route path="employees/creator/:employeeId" element={<DigitalCreatorOverview/>} />

           {/* Attendance Views */}
        <Route path="attendance/hr" element={<Attendance role="hr" />} />
        <Route path="attendance/developer" element={<Attendance role="softwaredeveloper" />} />
        <Route path="attendance/creator" element={<Attendance role="digitalcreator" />} />

        {/* Attendance Overview */}
        <Route path="/attendance/hr/:employeeId" element={< HrEmployeeOverview/>} />
        <Route path="/attendance/developer/:employeeId" element={<DeveloperAttendanceOverview />} />
        <Route path="/attendance/creator/:employeeId" element={<DigitalCreatorAttendanceOverview/>} />

         

          
    
          </Route>
        </Route>
        {/* Employee-only protected routes */}
<Route element={<RequireAuth roles={["employee"]} />}>
  <Route element={<EmployeeLayout />}>
    <Route path="/employee-attendance" element={<EmployeeAttendancePage />} />
  </Route>
</Route>
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin-login" replace />} />
      </Routes>
    </Router>
  );
}
  