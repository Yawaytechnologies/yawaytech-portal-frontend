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
import { ToastContainer, Slide, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminSalaries from "./pages/AdminSalaries.jsx";
import AdminPayrollPolicies from "./pages/AdminPayrollPolicies.jsx";
import AdminPayrollGenerate from "./pages/AdminPayrollGenerate.jsx";
import DepartmentOverview from "./components/EmployeeOverview/DepartmentOverview.jsx";
import Payslip from "/src/components/EmployeeSide/Payslip.jsx";

import AdminLogin from "./pages/AdminLogin.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AddExpensePage from "./pages/AddExpensePage.jsx";
import Employees from "./pages/EmployeePage.jsx";
import Attendance from "./pages/AttendancePage.jsx";
import NewEmployee from "./components/NewEmployee/AddEmployee.jsx";
import MonitoringViewer from "./components/EmployeeMonitoring.jsx";
import AdminSalaries from "./pages/AdminSalaries.jsx";
import AdminPayrollPolicies from "./pages/AdminPayrollPolicies.jsx";
import AdminPayrollGenerate from "./pages/AdminPayrollGenerate.jsx";
import AdminLeaveSuitePro from "./pages/AdminLeaveSuitePro.jsx";
import HolidaysPanel from "./components/leave-admin/HolidaysPanel.jsx";
import WorkweekPanel from "./components/leave-admin/WorkweekPanel.jsx";
import ShiftType from "./pages/Shift.jsx";
import DepartmentShift from "./pages/DepartmentShift.jsx";

// ── Employee pages ────────────────────────────────────────────────────────────
import EmployeeLogin from "./pages/EmployeeLogin.jsx";
import EmployeeProfile from "./pages/EmployeeProfile.jsx";
import EmployeeWork from "./pages/EmployeeWork.jsx";
import EmployeeWorklog from "./pages/EmployeWorklog.jsx";
import EmployeeAttendancePage from "./components/EmployeeSide/EmployeeAttendance.jsx";
import LeavePortal from "./pages/LeavePortal.jsx";
import LeaveReport from "./pages/LeaveReport.jsx";
import Shifts from "./components/EmployeeSide/Shifts.jsx";
import Payslip from "/src/components/EmployeeSide/Payslip.jsx";

// ── Shared components ─────────────────────────────────────────────────────────
import DepartmentOverview from "./components/EmployeeOverview/DepartmentOverview.jsx";
import DepartmentAttendanceOverview from "./components/AttendanceOverview/DepartmentAttendanceOverview.jsx";
import EmployeeLayout from "./pages/EmployeeLayout.jsx";
import ProtectedLayout from "./components/common/ProtectedLayout.jsx";
import PrivateRoute from "./components/common/PrivateRoute.jsx";
import AuthWatcher from "./components/common/AuthWatcher.jsx";
import NewEmployee from "./components/NewEmployee/AddEmployee.jsx";
import MonitoringViewer from "./components/EmployeeMonitoring.jsx";
import LeavePortal from "./pages/LeavePortal.jsx";
import LeaveReport from "./pages/LeaveReport.jsx";
import ShiftType from "./pages/Shift.jsx";
import DepartmentShift from "./pages/DepartmentShift.jsx";
import AdminLeaveSuitePro from "./pages/AdminLeaveSuitePro.jsx";
import HolidaysPanel from "./components/leave-admin/HolidaysPanel.jsx";
import WorkweekPanel from "./components/leave-admin/WorkweekPanel.jsx";

import Shifts from "./components/EmployeeSide/Shifts.jsx";

/* Shell per role */
function ShellSwitch() {
  const { user } = useSelector((s) => s.auth || {});
  if (user?.role === "employee") return <Outlet />;
  return <ProtectedLayout />;
}

/* Landing for / and /dashboard */
function RoleDashboardSwitch() {
  const { user } = useSelector((s) => s.auth || {});
  if (user?.role === "employee")
    return <Navigate to="/employee/profile" replace />;
  return <DashboardPage />;
}

export default function App() {
  /* Global "Failed to fetch" toast */
  useEffect(() => {
    const handleRejection = (event) => {
      const msg =
        event?.reason?.message ||
        (typeof event?.reason === "string" ? event.reason : "");

      if (msg && msg.toLowerCase().includes("failed to fetch")) {
        toast.error(
          "Failed to reach server. Please check your connection or backend.",
          {
            position: "top-right",
            transition: Slide,
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
          },
        );
      }
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  /* Backend ping — keeps Render from cold-starting */
  useEffect(() => {
    const pingBackend = async () => {
      try {
        await fetch(
          "https://yawaytech-portal-backend-python-2.onrender.com/api/department/IT",
          { method: "GET", mode: "no-cors" }
        );
      } catch (error) {
        console.error("Backend ping failed:", error);
      }
    };
    pingBackend();
    const interval = setInterval(pingBackend, 60000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const pingBackend = async () => {
      try {
        await fetch(
          "https://yawaytech-portal-backend-python-2.onrender.com/api/department/IT",
          {
            method: "GET",
            mode: "no-cors",
          },
        );
      } catch (error) {
        console.error("Backend ping failed:", error);
      }
    };

    pingBackend(); // call once immediately

    const interval = setInterval(() => {
      pingBackend();
    }, 60000); // every 1 minute

    return () => clearInterval(interval);
  }, []);
  return (
    <>
      <Router>
        <AuthWatcher />

        <Routes>
          {/* Root → admin login */}
          <Route path="/" element={<Navigate to="/admin-login" replace />} />

          {/* Public */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/employee-login" element={<EmployeeLogin />} />

          {/* Both roles */}
          <Route element={<PrivateRoute roles={["admin", "employee"]} />}>
            <Route element={<ShellSwitch />}>
              <Route index element={<RoleDashboardSwitch />} />
              <Route path="/dashboard" element={<RoleDashboardSwitch />} />
            </Route>
          </Route>

          {/* ── Admin only (with sidebar shell) ─────────────────────────── */}
          <Route element={<PrivateRoute roles={["admin"]} />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/add-expense" element={<AddExpensePage />} />
              <Route path="/employee/new" element={<NewEmployee />} />

              {/* Employee lists */}
              <Route path="/employees/hr" element={<Employees role="hr" />} />
              <Route path="/employees/developer" element={<Employees role="softwaredeveloper" />} />
              <Route path="/employees/marketing" element={<Employees role="marketing" />} />
              <Route path="/employees/finance" element={<Employees role="finance" />} />
              <Route path="/employees/sales" element={<Employees role="sales" />} />

              {/* Employee details */}
              <Route path="/employees/:department/:employeeId" element={<DepartmentOverview />} />
              <Route path="/employees/:department/:employeeId/worklog" element={<EmployeeWorklog />} />
              <Route path="/employees/:identifier" element={<EmployeeProfile />} />

              {/* Attendance lists */}
              <Route path="/attendance/hr" element={<Attendance role="hr" />} />
              <Route path="/attendance/developer" element={<Attendance role="softwaredeveloper" />} />
              <Route path="/attendance/marketing" element={<Attendance role="marketing" />} />
              <Route path="/attendance/finance" element={<Attendance role="finance" />} />
              <Route path="/attendance/sales" element={<Attendance role="sales" />} />
              <Route path="/attendance/department/:department/:employeeId" element={<DepartmentAttendanceOverview />} />

              {/* Monitoring */}
              <Route path="/monitoring" element={<MonitoringViewer />} />

              {/* Payroll */}
              <Route path="/admin/payroll-policies" element={<AdminPayrollPolicies />} />
              <Route path="/admin/salaries" element={<AdminSalaries />} />
              <Route path="/admin/payroll-generate" element={<AdminPayrollGenerate />} />

              {/* Shift */}
              <Route path="/shift/type" element={<ShiftType />} />
              <Route path="/shift/department" element={<DepartmentShift />} />

              {/* Leave admin */}
              <Route path="/admin-leave-suite-pro" element={<AdminLeaveSuitePro />} />
              <Route path="/leave/holidays" element={<HolidaysPanel />} />
              <Route path="/leave/workweek" element={<WorkweekPanel />} />
              <Route path="/shift/type" element={<ShiftType />} />
              <Route path="/shift/department" element={<DepartmentShift />} />
              <Route path="/admin/salaries" element={<AdminSalaries />} />
              <Route
                path="/admin/payroll-policies"
                element={<AdminPayrollPolicies />}
              />
              <Route
                path="/admin/payroll-generate"
                element={<AdminPayrollGenerate />}
              />

              {/* ✅ Face ID — admin registers employee face */}
              <Route path="/admin/faceid" element={<AdminFaceRegister />} />
            </Route>
          </Route>

          {/* ── Employee only ────────────────────────────────────────────── */}
          <Route element={<PrivateRoute roles={["employee"]} />}>
            <Route element={<EmployeeLayout />}>
              <Route path="/employee/profile" element={<EmployeeProfile />} />
              <Route path="/employee-attendance" element={<EmployeeAttendancePage />} />
              <Route path="/employee/leave" element={<LeavePortal />} />
              <Route path="/leave-report" element={<LeaveReport />} />
              <Route path="/employee/worklog" element={<EmployeeWork />} />
              <Route path="/employee/shifts" element={<Shifts />} />

              {/* ✅ Face ID — employee check in / check out */}
              <Route path="/employee/facescan" element={<EmployeeFaceScan />} />
              <Route path="/employee/shifts" element={<Shifts />} />
            </Route>
          </Route>

          {/* Payslip */}
          <Route path="/employee/payslip" element={<Payslip />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/admin-login" replace />} />
          <Route path="/employee/payslip" element={<Payslip />} />
        </Routes>
      </Router>

      {/* 🔔 Global Toast container (admin + employee) */}
      <ToastContainer
        position="top-center"
        autoClose={2200}
        hideProgressBar
        newestOnTop
        closeOnClick
        draggable={false}
        pauseOnHover
        pauseOnFocusLoss={false}
        limit={2}
      />
      <ToastContainer
        position="top-center"
        autoClose={2200}
        hideProgressBar
        newestOnTop
        closeOnClick
        draggable={false}
        pauseOnHover
        pauseOnFocusLoss={false}
        limit={2}
      />
    </>
  );
}