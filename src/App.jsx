// src/App.jsx
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useSelector } from "react-redux";
import DepartmentOverview from "./components/EmployeeOverview/DepartmentOverview.jsx";
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

import DepartmentAttendanceOverview from "./components/AttendanceOverview/DepartmentAttendanceOverview.jsx";
import EmployeeAttendancePage from "./components/EmployeeSide/EmployeeAttendance.jsx";
import ProtectedLayout from "./components/common/ProtectedLayout.jsx";
import PrivateRoute from "./components/common/PrivateRoute.jsx";
import AuthWatcher from "./components/common/AuthWatcher.jsx";
import NewEmployee from "./components/NewEmployee/AddEmployee.jsx";
// import AllWorklogs from "./pages/AllWorklogs.jsx";
import MonitoringViewer from "./components/EmployeeMonitoring.jsx";

/* 🔔 Toastify (global) */
import { ToastContainer, Slide, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* Shell per role */
function ShellSwitch() {
  const { user } = useSelector((s) => s.auth || {});
  if (user?.role === "employee") return <Outlet />; // employee pages don't use admin shell
  return <ProtectedLayout />; // admin shell
}

/* Landing for / and /dashboard */
function RoleDashboardSwitch() {
  const { user } = useSelector((s) => s.auth || {});
  if (user?.role === "employee")
    return <Navigate to="/employee/profile" replace />;
  return <DashboardPage />;
}

export default function App() {
  /* 🔔 Global "Failed to fetch" handler */
  useEffect(() => {
    const handleRejection = (event) => {
      const msg =
        event?.reason?.message ||
        (typeof event?.reason === "string" ? event.reason : "");

      if (msg && msg.toLowerCase().includes("failed to fetch")) {
        toast.error(
          "Failed to reach server. Please check your connection or backend.",
          {
            position: "top-center",
            transition: Slide,
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
          }
        );
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    return () =>
      window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <>
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

              <Route path="/employee/new" element={<NewEmployee />} />

              {/* Employee lists */}
              <Route path="/employees/hr" element={<Employees role="hr" />} />
              <Route
                path="/employees/developer"
                element={<Employees role="softwaredeveloper" />}
              />
              <Route
                path="/employees/marketing"
                element={<Employees role="marketing" />}
              />
              <Route
                path="/employees/finance"
                element={<Employees role="finance" />}
              />
              <Route
                path="/employees/sales"
                element={<Employees role="sales" />}
              />

              {/* Employee details */}
              <Route
                path="/employees/:department/:employeeId"
                element={<DepartmentOverview />}
              />
              <Route
                path="/employees/:department/:employeeId/worklog"
                element={<EmployeeWorklog />}
              />

              {/* Attendance lists */}
              <Route path="/attendance/hr" element={<Attendance role="hr" />} />
              <Route
                path="/attendance/developer"
                element={<Attendance role="softwaredeveloper" />}
              />
              <Route
                path="/attendance/marketing"
                element={<Attendance role="marketing" />}
              />
              <Route
                path="/attendance/finance"
                element={<Attendance role="finance" />}
              />
              <Route
                path="/attendance/sales"
                element={<Attendance role="sales" />}
              />

              <Route
                path="/attendance/department/:department/:employeeId"
                element={<DepartmentAttendanceOverview />}
              />

              {/* <Route path="/all-worklogs" element={<AllWorklogs />} /> */}
              <Route path="/monitoring" element={<MonitoringViewer />} />

              {/* Generic: admin can open any employee by id/code */}
              <Route
                path="/employees/:identifier"
                element={<EmployeeProfile />}
              />
            </Route>
          </Route>

          {/* Employee-only */}
          <Route element={<PrivateRoute roles={["employee"]} />}>
            <Route element={<EmployeeLayout />}>
              <Route path="/employee/profile" element={<EmployeeProfile />} />
              <Route
                path="/employee-attendance"
                element={<EmployeeAttendancePage />}
              />
              <Route path="/employee/worklog" element={<EmployeeWork />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/admin-login" replace />} />
        </Routes>
      </Router>

      {/* 🔔 Global Toast container */}
      <ToastContainer
        position="top-center"
        transition={Slide}
        limit={1}
        closeButton={false}
        newestOnTop
        style={{ top: 10 }}
        toastClassName={() => "m-0 p-0 bg-transparent shadow-none"}
        bodyClassName={() => "m-0 p-0"}
      />
    </>
  );
}
