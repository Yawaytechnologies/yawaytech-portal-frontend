import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../redux/actions/authActions";

/**
 * Use:
 * <Route element={<PrivateRoute roles={["admin"]} />}>
 *   <Route element={<ProtectedLayout />}>...</Route>
 * </Route>
 */
export default function PrivateRoute({ roles }) {
  const { token, user, expiresAt } = useSelector((s) => s.auth || {});
  const dispatch = useDispatch();

  const expired = !token || !expiresAt || Date.now() >= expiresAt;
  const authed = !!token && !expired;

  if (!authed) {
    if (expired) dispatch(logoutUser());
    const target = user?.role === "employee" ? "/employee-login" : "/admin-login";
    return <Navigate to={target} replace />;
  }

  if (roles?.length && !roles.includes(user?.role)) {
    const target = user?.role === "employee" ? "/employee-login" : "/admin-login";
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
