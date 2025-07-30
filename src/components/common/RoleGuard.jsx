// src/components/common/RoleGuard.jsx
import { Navigate } from "react-router-dom";

const RoleGuard = ({ allowedRoles, children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;

  return children;
};

export default RoleGuard;
