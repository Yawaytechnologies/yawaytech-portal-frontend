import React, { useEffect, useState } from "react";
import { FaBars, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function EmployeeHeader({ onOpenSidebar, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    // Clear whatever you use for auth
    try {
      localStorage.removeItem("auth.token");
      localStorage.removeItem("auth.user");
      // sessionStorage.clear(); // optional
    } catch (e) {
      // Ignore storage errors (quota/private mode). Consume var to satisfy ESLint.
      void e;
    }

    if (typeof onLogout === "function") onLogout();

    // Redirect to login; replace prevents going back to a protected page
    navigate("/employee-login", { replace: true });
  };

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
          {/* left: menu + title */}
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
                Yaway{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-blue-700">
                  Tech
                </span>{" "}
                Portal
              </h1>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
                className="origin-left mt-0.5 h-[2px] w-24 bg-gradient-to-r from-indigo-600/80 to-blue-600/80 rounded-full"
              />
            </div>
          </div>

          {/* right: user + logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              whileHover={{ y: -1 }}
              className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm"
            >
              <FaUserCircle className="text-xl text-indigo-600" />
            </motion.div>

            <motion.button
              onClick={handleLogout}
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
    </motion.header>
  );
}
