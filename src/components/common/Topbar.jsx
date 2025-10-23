import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HiMenu } from "react-icons/hi";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../redux/actions/authActions";

export default function Topbar({ toggleSidebar }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const reduxUser = useSelector((state) => state.auth.user);
  const localUser = JSON.parse(localStorage.getItem("user"));
  const user = reduxUser || localUser;

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const cancelBtnRef = useRef(null);

  

  // Central title map for exact paths
  const TITLE_MAP = useMemo(
    () => ({
      "/": "Dashboard",
      "/dashboard": "Dashboard",
      "/add-expense": "Track Expense",

      "/employees/new": "New Employee",
      "/employees": "Employees Profile",
      "/employees/hr": "Employees Profile · HR",
      "/employees/developer": "Employees Profile · Software Developer",
      "/employees/creator": "Employees Profile · Digital Creator",

      "/attendance": "Employees Attendance",
      "/attendance/hr": "Employees Attendance · HR",
      "/attendance/developer": "Employees Attendance · Software Developer",
      "/attendance/creator": "Employees Attendance · Digital Creator",

      
    }),
    []
  );

  // Compute page title
  const title = useMemo(() => {
    // 1) Prefer explicit title passed via NavLink state
    const stateTitle = location.state && location.state.title;
    if (stateTitle) return stateTitle;

    // 2) Fallbacks by path
    const path = location.pathname.toLowerCase();
    if (TITLE_MAP[path]) return TITLE_MAP[path];

    // 3) Pattern-based handling
    if (path.startsWith("/employees")) {
      if (path.startsWith("/employees/new")) return "New Employee";
      const roleSlug = path.split("/")[2]; // hr | developer | creator
      const roleMap = { hr: "HR", developer: "Software Developer", creator: "Digital Creator" };
      const role = roleMap[roleSlug];
      return role ? `Employees Profile · ${role}` : "Employees Profile";
    }

    if (path.startsWith("/attendance")) {
      const roleSlug = path.split("/")[2];
      const roleMap = { hr: "HR", developer: "Software Developer", creator: "Digital Creator" };
      const role = roleMap[roleSlug];
      return role ? `Employees Attendance · ${role}` : "Employees Attendance";
    }

  

    if (path.includes("/add-expense")) return "Track Expense";

    return "Dashboard";
  }, [location.pathname, location.state, TITLE_MAP]);

  // Friendly display name for user chip
  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.adminId ||
    user?.employeeId ||
    user?.email ||
    "User";

  const confirmLogout = () => {
    dispatch(logoutUser());
    const loginPath = user?.role === "employee" ? "/employee-login" : "/admin-login";
    navigate(loginPath);
  };

  // Focus cancel when modal opens
  useEffect(() => {
    if (showLogoutConfirm) cancelBtnRef.current?.focus();
  }, [showLogoutConfirm]);

  // Keep browser tab title in sync
  useEffect(() => {
    document.title = `${title} · Yaway Tech Portal`;
  }, [title]);

  return (
    <>
      <header className="text-white shadow-md h-16 px-4 flex items-center justify-between w-full bg-gradient-to-r from-[#0e1b34] via-[#18234b] to-[#223366]">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="text-2xl text-white md:hidden block cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <HiMenu />
          </button>
          <h1 className="text-lg font-semibold text-white hidden md:block cursor-pointer">
            {title}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-accent transition-colors duration-200"
            title="User Profile"
          >
            <FaUserCircle className="text-xl" />
            <span className="text-sm font-medium">{displayName}</span>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="group flex h-[45px] w-[45px] items-center cursor-pointer rounded-full bg-[#FF5800] shadow-md overflow-hidden transition-all duration-300 hover:w-[130px] hover:rounded-[40px] active:translate-x-[1px] active:translate-y-[1px]"
            aria-label="Logout"
          >
            <div className="flex h-full w-[45px] items-center justify-center">
              <FaSignOutAlt className="text-[18px] text-white" />
            </div>
            <span
              className="ml-2 w-0 overflow-hidden text-sm font-semibold text-white opacity-0 transition-all duration-300
                         group-hover:w-auto group-hover:opacity-100"
            >
              Logout
            </span>
          </button>
        </div>
      </header>

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-3"
          onKeyDown={(e) => e.key === "Escape" && setShowLogoutConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-desc"
            className="w-full max-w-xs rounded-xl bg-white p-4 text-gray-800 shadow-2xl"
          >
            <div id="logout-title" className="text-sm font-semibold">
              Logout?
            </div>
            <p id="logout-desc" className="mt-1 text-[13px] text-gray-600">
              You will be redirected to the login page.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                ref={cancelBtnRef}
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50
                           focus:outline-none focus:ring-0
                           focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700
                           focus:outline-none focus:ring-0
                           focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
