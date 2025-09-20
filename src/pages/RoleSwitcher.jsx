import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiUser } from "react-icons/fi";

const ROLES = [
  { key: "Employee", label: "Employee", path: "/employee-login" },
  { key: "Admin", label: "Admin", path: "/admin-login" },
];

export default function RoleSwitcher({ current = "Employee", placement = "absolute" }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const navigate = useNavigate();

  // Memoized selection so identity is stable
  const selected = useMemo(
    () => ROLES.find((r) => r.key === current) ?? ROLES[0],
    [current]
  );

  // keep activeIndex aligned with current when open
  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, ROLES.findIndex((r) => r.key === current));
    setActiveIndex(idx);
  }, [open, current]);

  // Close on outside click & Esc
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const goTo = (role) => {
    setOpen(false);
    if (role.key !== current) navigate(role.path);
  };

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
    } else if (e.key === "Tab") {
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
        <button
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

        {open && (
          <ul
            id="role-switcher-listbox"
            role="listbox"
            tabIndex={-1}
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
          </ul>
        )}
      </div>
    </div>
  );
}
