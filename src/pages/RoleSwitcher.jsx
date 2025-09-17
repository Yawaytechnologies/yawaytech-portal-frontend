import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {AnimatePresence } from "framer-motion";
import { FiChevronDown, FiUser } from "react-icons/fi";

const ROLES = [
  { key: "Employee", label: "Employee", path: "/employee-login" },
  { key: "Admin", label: "Admin", path: "/admin-login" },
];

export default function RoleSwitcher({ current = "Employee", placement = "absolute" }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, ROLES.findIndex((r) => r.key === current))
  );
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const selected = ROLES.find((r) => r.key === current) ?? ROLES[0];

  const goTo = useCallback(
    (role) => {
      setOpen(false);
      if (role.key !== current) navigate(role.path);
      // Return focus to the button after selection for good UX
      requestAnimationFrame(() => buttonRef.current?.focus());
    },
    [current, navigate]
  );

  // Close on outside click & Esc
  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // When opening, move focus to the list and set activeIndex to current selection
  useEffect(() => {
    if (open) {
      setActiveIndex(Math.max(0, ROLES.findIndex((r) => r.key === current)));
      requestAnimationFrame(() => listRef.current?.focus());
    }
  }, [open, current]);

  const onButtonKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % ROLES.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + ROLES.length) % ROLES.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      goTo(ROLES[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "Tab") {
      // close on tab to maintain natural focus order
      setOpen(false);
    }
  };

  const wrapperClass =
    placement === "absolute"
      ? "absolute top-3 right-3 select-none z-20"
      : "select-none";

  return (
    <div className={wrapperClass} ref={rootRef}>
      <div className="relative">
        {/* Main button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onButtonKeyDown}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-blue-700 transition"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="role-switcher-listbox"
        >
          <FiUser className="opacity-90" aria-hidden="true" />
          {selected.label}
          <FiChevronDown
            className={`transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.ul
              id="role-switcher-listbox"
              ref={listRef}
              tabIndex={-1}
              role="listbox"
              aria-activedescendant={`role-option-${ROLES[activeIndex].key}`}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onKeyDown={onListKeyDown}
              className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-lg border border-blue-200 bg-white shadow-lg focus:outline-none"
            >
              {ROLES.map((role, idx) => {
                const isSelected = role.key === current;
                const isActive = idx === activeIndex;
                return (
                  <li key={role.key} role="option" aria-selected={isSelected} id={`role-option-${role.key}`}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => goTo(role)}
                      className={[
                        "w-full text-left px-3 py-2 text-sm transition",
                        isActive ? "bg-blue-50" : "bg-white",
                        isSelected ? "font-bold text-blue-700" : "text-blue-900 hover:bg-blue-50",
                      ].join(" ")}
                    >
                      {role.label}
                      {isSelected && <span className="sr-only"> (current)</span>}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
