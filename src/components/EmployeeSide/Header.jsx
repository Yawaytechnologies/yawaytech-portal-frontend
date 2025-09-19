import React, { useEffect, useState, useMemo } from "react";
import { FaBars, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

export default function EmployeeHeader({ onOpenSidebar, onLogout, userId }) {
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("auth.token");
      localStorage.removeItem("auth.user");
    } catch (e) {
      void e;
    }
    if (typeof onLogout === "function") onLogout();
    navigate("/employee-login", { replace: true });
  };

  // Page title based on current route
  const pageTitle = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/employee-attendance")) return "Employee Attendance";
    if (p.startsWith("/employee/profile")) return "Profile";
    return "Employee";
  }, [location.pathname]);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="sticky top-0 z-30"
      role="banner"
    >
      {/* top accent line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="h-[3px] origin-left bg-gradient-to-r from-indigo-600 via-sky-500 to-blue-600"
      />

      <div
        className={[
          "relative overflow-hidden border-b border-slate-200 backdrop-blur-xl",
          scrolled ? "shadow-md" : "shadow-sm",
        ].join(" ")}
        style={{
          backgroundImage: `
            radial-gradient(420px 280px at 75% 28%,
              rgba(79,70,229,0.16),
              rgba(14,165,233,0.10) 60%,
              rgba(255,255,255,0) 70%),
            linear-gradient(90deg,
              rgba(255,255,255,0.70),
              rgba(255,255,255,0.45),
              rgba(255,255,255,0.70))
          `,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>

        {/* curved gradient wave (background) */}
        <svg
          aria-hidden
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -top-16 right-0 h-[220%] w-[60%] md:w-[45%]"
        >
          <defs>
            <linearGradient id="ygWave" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <path d="M0,0 C300,120 600,0 1200,110 L1200,0 L0,0 Z" fill="url(#ygWave)" />
        </svg>

        <div
          className={[
            "relative mx-auto flex items-center justify-between px-4 md:px-6 transition-all duration-200",
            scrolled ? "h-14" : "h-16",
          ].join(" ")}
        >
          {/* left: menu + dynamic page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSidebar}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 active:scale-[0.98] transition"
              aria-label="Open sidebar"
            >
              <FaBars />
            </button>

            <div className="flex flex-col">
              <h1
                className={[
                  "font-extrabold tracking-tight text-slate-900",
                  scrolled ? "text-[1.05rem]" : "text-[1.2rem] md:text-[1.3rem]",
                ].join(" ")}
              >
                {pageTitle}
              </h1>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
                className="origin-left mt-0.5 h-[2px] w-24 bg-gradient-to-r from-indigo-600/80 to-blue-600/80 rounded-full"
              />
            </div>
          </div>

          {/* right: user id chip + user icon + logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {userId ? (
              <motion.span
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium border border-slate-200"
                title="Logged in ID"
              >
                {String(userId).toUpperCase()}
              </motion.span>
            ) : null}

            <motion.div
              whileHover={{ y: -1 }}
              className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm"
              title="My Account"
            >
              <FaUserCircle className="text-xl text-indigo-600" />
            </motion.div>

            <motion.button
              onClick={() => setShowLogoutConfirm(true)} // open popup
              whileTap={{ scale: 0.97 }}
              aria-label="Logout"
              className="group relative h-10 w-10 rounded-full overflow-hidden
               bg-gradient-to-r from-indigo-600 to-blue-600 text-white
               hover:from-indigo-700 hover:to-blue-700
               transition-[width,background-color,box-shadow] duration-300 ease-out
               hover:w-[7.5rem]
               shadow-md hover:shadow-[0_0_20px_rgba(79,70,229,0.6)]"
            >
              <div
                className="flex items-center h-full w-full
                 justify-center group-hover:justify-start
                 px-0 group-hover:px-3
                 transition-all duration-300 ease-out"
              >
                <FaSignOutAlt className="text-lg shrink-0 mr-0 group-hover:mr-2 transition-all duration-300" />
                <span
                  className="whitespace-nowrap overflow-hidden
                   max-w-0 opacity-0 translate-x-1
                   group-hover:max-w-[64px] group-hover:opacity-100 group-hover:translate-x-0
                   transition-all duration-300 ease-out"
                >
                  Logout
                </span>
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* subtle underline */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />

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
            <div id="logout-title" className="text-sm font-semibold">
              Logout?
            </div>
            <p id="logout-desc" className="mt-1 text-[13px] text-gray-600">
              You will be redirected to the login page.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50
                           focus:outline-none focus:ring-0
                           focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
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
    </motion.header>
  );
}
