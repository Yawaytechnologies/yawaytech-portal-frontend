import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiUser } from "react-icons/fi";

const ROLES = [
  { key: "Employee", label: "Employee", path: "/employee-login" },
  { key: "Admin", label: "Admin", path: "/admin-login" },
];

export default function RoleSwitcher({ current = "Employee", placement = "absolute" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click & Esc
  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const selected = ROLES.find((r) => r.key === current) ?? ROLES[0];

  const goTo = (role) => {
    setOpen(false);
    if (role.key !== current) navigate(role.path);
  };

  const wrapperClass =
    placement === "absolute"
      ? "absolute top-3 right-3 select-none z-20"
      : "select-none";

  return (
    <div className={wrapperClass} ref={rootRef}>
      <div className="relative">
        {/* 🔵 Main button styled like Sign In button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-blue-700 transition"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <FiUser className="opacity-90" />
          {selected.label}
          <FiChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* ⬇️ Dropdown stays white/light */}
        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-lg border border-blue-200 bg-white shadow-lg"
              role="listbox"
              tabIndex={-1}
            >
              {ROLES.map((role) => (
                <li key={role.key}>
                  <button
                    type="button"
                    onClick={() => goTo(role)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition ${
                      role.key === current ? "font-bold text-blue-700" : "text-blue-900"
                    }`}
                    role="option"
                    aria-selected={role.key === current}
                  >
                    {role.label}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
