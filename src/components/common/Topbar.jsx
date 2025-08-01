// src/components/common/Topbar.jsx
import React from "react";
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

  const getTitle = () => {
    if (location.pathname === "/" || location.pathname.includes("dashboard")) return "Dashboard";
    if (location.pathname.includes("add-expense")) return "Track Expense";
    return "Dashboard";
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      dispatch(logoutUser());
      navigate("/signin");
    }
  };

  return (
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
          <span className="text-sm font-medium">
            {user?.firstName || user?.email || "User"}
          </span>
        </div>

        <button
          onClick={handleLogout}
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
  );
}
