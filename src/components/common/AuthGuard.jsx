// src/components/common/AuthGuard.jsx
import { Navigate } from "react-router-dom";

const AuthGuard = ({ children }) => {
  const token = localStorage.getItem("token"); // or use userId/session if preferred

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AuthGuard;
