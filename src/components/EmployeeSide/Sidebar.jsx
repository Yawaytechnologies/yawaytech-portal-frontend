// src/components/EmployeeSide/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import {
  FaUser,
  FaCalendarCheck,
  FaTasks,
  FaFileInvoiceDollar,
  FaClock,
} from "react-icons/fa";
import { BsFillCameraFill } from "react-icons/bs";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useTransform,
} from "framer-motion";

const MotionDiv = motion.div;
const MotionAside = motion.aside;
const MotionNav = motion.nav;
const MotionSpan = motion.span;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : false
  );
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);
  return isDesktop;
}

const baseLink = "group relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition select-none";
const inactive = "text-white/90 hover:bg-white/10 hover:-translate-y-[1px]";
const active = "text-white bg-white/15 shadow-[0_8px_24px_-12px_rgba(0,0,0,.5)]";

function ActiveBar({ active: isActive }) {
  return (
    <MotionSpan
      layout
      initial={false}
      animate={{ opacity: isActive ? 1 : 0, scaleY: isActive ? 1 : 0.4 }}
      transition={{ duration: 0.18 }}
      className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-full bg-white"
    />
  );
}

// ── All nav links — defined once, used in both desktop & mobile ───────────────
const NAV_LINKS = [
  { to: "/employee/profile", end: true, icon: <FaUser />, label: "Profile", hint: "View" },
  { to: "/employee-attendance", end: false, icon: <FaCalendarCheck />, label: "Employee Attendance", hint: "Open" },
  { to: "/employee/payslip", end: false, icon: <FaFileInvoiceDollar />, label: "Payslip", hint: "View" },
  { to: "/employee/worklog", end: false, icon: <FaTasks />, label: "Worklog", hint: "Open" },
  { to: "/employee/shifts", end: false, icon: <FaClock />, label: "My Shift", hint: "View" },
  { to: "/employee/facescan", end: false, icon: <BsFillCameraFill />, label: "Face Attendance", hint: "Scan" },
];

export default function EmployeeSidebar({
  isOpen,
  onClose,
  brandTitle = "Yaway Tech Portal",
}) {
  const isDesktop = useIsDesktop();

  const container = {
    hidden: { opacity: 0, x: -12 },
    show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
  };
  const list = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
  };
  const item = {
    hidden: { y: 6, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.22 } },
  };

  const mouseX = useMotionValue(75);
  const mouseY = useMotionValue(25);
  const smoothX = useSpring(mouseX, { stiffness: 28, damping: 26 });
  const smoothY = useSpring(mouseY, { stiffness: 28, damping: 26 });

  const spotlightBg = useMotionTemplate`
    radial-gradient(280px 200px at ${smoothX}% ${smoothY}%,
      rgba(255,255,255,0.08),
      rgba(99,102,241,0.10) 45%,
      rgba(0,0,0,0) 65%)
  `;

  const driftGlowX = useTransform(smoothX, (v) => (v - 50) * 0.3);
  const driftGlowY = useTransform(smoothY, (v) => (v - 50) * 0.2);
  const driftDiagX = useTransform(smoothX, (v) => (50 - v) * 0.3);
  const driftDiagY = useTransform(smoothY, (v) => (v - 50) * 0.3);

  const handleSideMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width) * 100);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 100);
  };
  const handleSideLeave = () => { mouseX.set(75); mouseY.set(25); };

  return (
    <>
      {/* Backdrop (mobile only) */}
      {!isDesktop && (
        <MotionDiv
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.18 }}
          className={`fixed inset-0 z-30 bg-black/45 md:hidden ${isOpen ? "" : "pointer-events-none"}`}
          onClick={onClose}
        />
      )}

      <MotionAside
        variants={container}
        initial="hidden"
        animate="show"
        className={[
          "fixed left-0 top-0 z-40 h-screen w-72 text-white flex",
          "transform transition-transform duration-300 ease-out",
          !isDesktop && !isOpen ? "-translate-x-full" : "translate-x-0",
          "md:translate-x-0",
        ].join(" ")}
        aria-hidden={!isDesktop && !isOpen ? "true" : "false"}
      >
        <div
          onMouseMove={handleSideMove}
          onMouseLeave={handleSideLeave}
          className="relative h-full w-full overflow-hidden bg-gradient-to-b from-indigo-800 via-indigo-700 to-blue-800"
        >
          <MotionDiv className="pointer-events-none absolute inset-0" style={{ background: spotlightBg }} />
          <MotionDiv className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" style={{ x: driftGlowX, y: driftGlowY }} />
          <MotionDiv className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rotate-[-30deg] rounded-[40px] bg-white/5" style={{ x: driftDiagX, y: driftDiagY }} />

          {/* ── DESKTOP ── */}
          {isDesktop ? (
            <div className="h-full flex flex-col overflow-y-auto">
              <div className="px-5 pt-7 pb-6 border-b border-white/15">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 rounded-lg bg-white/15 text-white font-bold items-center justify-center">
                    Y
                  </span>
                  <h1 className="text-[17px] font-semibold leading-tight">{brandTitle}</h1>
                </div>
              </div>

              <MotionNav variants={list} initial="hidden" animate="show" className="px-3 pt-4 space-y-2">
                {NAV_LINKS.map(({ to, end, icon, label, hint }) => (
                  <MotionDiv key={to} variants={item}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) => `${baseLink} ${isActive ? active : inactive}`}
                    >
                      {({ isActive }) => (
                        <>
                          <ActiveBar active={isActive} />
                          <span className="inline-flex w-8 justify-center">{icon}</span>
                          <span>{label}</span>
                          <span className="ml-auto opacity-0 group-hover:opacity-100 transition text-[10px] tracking-wide">
                            {hint}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </MotionDiv>
                ))}
              </MotionNav>

              <div className="mt-auto p-4 text-xs text-white/70">
                © {new Date().getFullYear()} Yaway
              </div>
            </div>

          ) : (
            /* ── MOBILE ── */
            <div className="h-full flex flex-col overflow-y-auto">
              <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/15">
                <span className="font-semibold">{brandTitle}</span>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
                  <IoClose size={22} />
                </button>
              </div>

              <MotionNav variants={list} initial="hidden" animate="show" className="px-3 space-y-2 pt-4">
                {NAV_LINKS.map(({ to, end, icon, label }) => (
                  <MotionDiv key={to} variants={item}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) => `${baseLink} ${isActive ? active : inactive}`}
                      onClick={onClose}
                    >
                      {({ isActive }) => (
                        <>
                          <ActiveBar active={isActive} />
                          <span className="inline-flex w-8 justify-center">{icon}</span>
                          <span>{label}</span>
                        </>
                      )}
                    </NavLink>
                  </MotionDiv>
                ))}
              </MotionNav>

              <div className="mt-auto p-4 text-xs text-white/70">
                © {new Date().getFullYear()} Yaway
              </div>
            </div>
          )}
        </div>
      </MotionAside>
    </>
  );
}