// src/pages/EmployeePage.jsx
import React, { useMemo } from "react";
import DepartmentAttendance from "../components/Attendance/DepartmentAttendance";

/** Map your existing role prop to the unified dept segment */
const roleToDept = (role) => {
  switch (String(role || "").toLowerCase()) {
    case "hr":
      return "hr";
    case "marketing":
      return "marketing";
    case "finance":
      return "finance";
    case "sales":
      return "sales";
    case "softwaredeveloper":
    case "developer":
    case "it":
      return "developer"; // matches /employees/developer/:employeeId
    default:
      return "hr";
  }
};

export default function Attendance({ role = "hr" }) {
  const dept = useMemo(() => roleToDept(role), [role]);
  return <DepartmentAttendance dept={dept} />;
}
