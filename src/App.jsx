import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useSelector } from "react-redux";

import AdminLogin from "./pages/AdminLogin.jsx";
import EmployeeLogin from "./pages/EmployeeLogin.jsx";
import EmployeeWorklog from "./pages/EmployeWorklog.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AddExpensePage from "./pages/AddExpensePage.jsx";
import Employees from "./pages/EmployeePage.jsx";
import Attendance from "./pages/AttendancePage.jsx";
import EmployeeProfile from "./pages/EmployeeProfile.jsx";
import EmployeeLayout from "./pages/EmployeeLayout.jsx";
import EmployeeWork from "./pages/EmployeeWork.jsx";
import HRDetail from "./components/EmployeeOverview/HrOverview.jsx";
import SoftwareDeveloperOverview from "./components/EmployeeOverview/SoftwareDeveloperOverview.jsx";
import DigitalCreatorOverview from "./components/EmployeeOverview/DigitalCreatorOverview.jsx";
import HrEmployeeOverview from "./components/AttendanceOverview/HREmployeesOverview.jsx";
import DeveloperAttendanceOverview from "./components/AttendanceOverview/DeveloperAttendanceOverview.jsx";
import DigitalCreatorAttendanceOverview from "./components/AttendanceOverview/DigitalCreatorAttendanceOverview.jsx";
import EmployeeAttendancePage from "./components/EmployeeSide/EmployeeAttendance.jsx";

import ProtectedLayout from "./components/common/ProtectedLayout.jsx";
import PrivateRoute from "./components/common/PrivateRoute.jsx";
import AuthWatcher from "./components/common/AuthWatcher.jsx";
import NewEmployee from "./components/NewEmployee/AddEmployee.jsx";
import AllWorklogs from "./pages/AllWorklogs.jsx";

/* Shell per role */
function ShellSwitch() {
  const { user } = useSelector((s) => s.auth || {});
  if (user?.role === "employee") return <Outlet />; // employee pages don't use admin shell
  return <ProtectedLayout />; // admin shell
}

/* Landing for / and /dashboard */
function RoleDashboardSwitch() {
  const { user } = useSelector((s) => s.auth || {});
  if (user?.role === "employee") return <Navigate to="/employee/profile" replace />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <Router>
      {/* Global session enforcement */}
      <AuthWatcher />

      <Routes>
        {/* Always start at admin login */}
        <Route path="/" element={<Navigate to="/admin-login" replace />} />

        {/* Public login routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />

        {/* Protected for BOTH roles */}
        <Route element={<PrivateRoute roles={["admin", "employee"]} />}>
          <Route element={<ShellSwitch />}>
            <Route index element={<RoleDashboardSwitch />} />
            <Route path="/dashboard" element={<RoleDashboardSwitch />} />
          </Route>
        </Route>

        {/* Admin-only (always with admin shell) */}
        <Route element={<PrivateRoute roles={["admin"]} />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/add-expense" element={<AddExpensePage />} />

            <Route path="/employee/new" element={<NewEmployee/>} />

            {/* Employee lists */}
            <Route path="/employees/hr" element={<Employees role="hr" />} />
            <Route path="/employees/developer" element={<Employees role="softwaredeveloper" />} />
            <Route path="/employees/creator" element={<Employees role="digitalcreator" />} />

            {/* Employee details */}
            <Route path="/employees/hr/:employeeId" element={<HRDetail />} />
            <Route path="/employees/developer/:employeeId" element={<SoftwareDeveloperOverview />} />
            <Route path="/employees/creator/:employeeId" element={<DigitalCreatorOverview />} />
             <Route path="/employees/hr/:employeeId/worklog" element={<EmployeeWorklog />} />
             <Route path="/employees/developer/:employeeId/worklog" element={<EmployeeWorklog />} />
             

            {/* Attendance lists */}
            <Route path="/attendance/hr" element={<Attendance role="hr" />} />
            <Route path="/attendance/developer" element={<Attendance role="softwaredeveloper" />} />
            <Route path="/attendance/creator" element={<Attendance role="digitalcreator" />} />

            {/* Attendance details */}
            <Route path="/attendance/hr/:employeeId" element={<HrEmployeeOverview />} />
            <Route path="/attendance/developer/:employeeId" element={<DeveloperAttendanceOverview />} />
            <Route path="/attendance/creator/:employeeId" element={<DigitalCreatorAttendanceOverview />} />

            {/* <Route path="/all-worklogs" element={<AllWorklogs />} /> */}

            {/* Generic: admin can open any employee by id/code */}
            <Route path="/employees/:identifier" element={<EmployeeProfile />} />
             
          </Route>
        </Route>

        {/* Employee-only */}
        <Route element={<PrivateRoute roles={["employee"]} />}>
          <Route element={<EmployeeLayout />}>
            <Route path="/employee/profile" element={<EmployeeProfile />} />
            <Route path="/employee-attendance" element={<EmployeeAttendancePage />} />
            
            <Route path="/employee/worklog" element={<EmployeeWork />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin-login" replace />} />
        
      </Routes>
    </Router>
  );
}
