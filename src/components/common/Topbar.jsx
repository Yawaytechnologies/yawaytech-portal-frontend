import React, { useEffect, useRef, useState } from "react";
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

  // map URL → title (with role if available)
  const getTitle = () => {
    const path = location.pathname.toLowerCase();

    // dashboard
    if (path === "/" || path.includes("/dashboard")) return "Dashboard";

    // expense
    if (path.includes("/add-expense")) return "Track Expense";

    // employees profile: /employees/:role?
    if (path.startsWith("/employees")) {
      const roleSlug = path.split("/")[2]; // hr | developer | creator | undefined
      const roleMap = {
        hr: "HR",
        developer: "Software Developer",
        creator: "Digital Creator",
      };
      const role = roleMap[roleSlug];
      return role ? `Employees Profile · ${role}` : "Employees Profile";
    }

    // employees attendance: /attendance/:role?
    if (path.startsWith("/attendance")) {
      const roleSlug = path.split("/")[2];
      const roleMap = {
        hr: "HR",
        developer: "Software Developer",
        creator: "Digital Creator",
      };
      const role = roleMap[roleSlug];
      return role ? `Employees Attendance · ${role}` : "Employees Attendance";
    }

    return "Dashboard";
  };

  // Friendly display name
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

  // Focus Cancel when modal opens
  useEffect(() => {
    if (showLogoutConfirm) cancelBtnRef.current?.focus();
  }, [showLogoutConfirm]);

  return (
    <>
      <header className="text-white shadow-md h-16 px-4 flex items-center justify-between w-full bg-gradient-to-r from-[#0e1b34] via-[#18234b] to-[#223366]">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="text-2xl text-white md:hidden block cursor-pointer"
          >
            <HiMenu />
          </button>
          <h1 className="text-lg font-semibold text-white hidden md:block cursor-pointer">
            {getTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-accent transition-colors duration-200"
            title="User Profile"
          >
            <FaUserCircle className="text-xl" />
            <span className="text-sm font-medium">{displayName}</span>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="group flex items-center w-[45px] h-[45px] cursor-pointer bg-[#FF5800] rounded-full shadow-md overflow-hidden transition-all duration-300 hover:w-[130px] hover:rounded-[40px] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <div className="flex items-center justify-center w-[45px] h-full">
              <FaSignOutAlt className="text-white text-[18px]" />
            </div>
            <span
              className="ml-2 text-white text-sm font-semibold whitespace-nowrap opacity-0 w-0 overflow-hidden 
              transition-all duration-300 
              group-hover:opacity-100 group-hover:w-auto"
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
            className="bg-white text-gray-800 rounded-xl shadow-2xl w-full max-w-xs p-4"
          >
            <div id="logout-title" className="text-sm font-semibold">Logout?</div>
            <p id="logout-desc" className="mt-1 text-[13px] text-gray-600">
              You will be redirected to the login page.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                ref={cancelBtnRef}
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50
                           focus:outline-none focus:ring-0
                           focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700
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
