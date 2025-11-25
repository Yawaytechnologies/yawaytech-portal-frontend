// src/components/dashboard/CategoryPieChart.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";
import {
  FaUtensils,
  FaBus,
  FaShoppingBag,
  FaHeartbeat,
  FaEllipsisH,
  FaChevronDown,
  FaBolt,
  FaFilm,
  FaLaptopCode,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toast, Slide } from "react-toastify";

import {
  selectSelectedCategory,
  selectPieData,
  setPieType,
  setSelectedCategory,
  clearSelectedCategory,
} from "../../redux/reducer/categoryPieSlice";
import { fetchCategoryPie } from "../../redux/actions/categoryPieActions";

/* 🔔 Toast pill config */
const TOAST_BASE = {
  position: "top-center",
  transition: Slide,
  autoClose: 1800,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
};

const PILL = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  width: "auto",
  maxWidth: "min(72vw, 260px)",
  padding: "5px 9px",
  lineHeight: 1.2,
  minHeight: 0,
  borderRadius: "10px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
  fontSize: "0.80rem",
  fontWeight: 600,
};

const STYLE_ERROR = {
  ...PILL,
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
};

/* Colors & Icons (pretty labels) */
const CATEGORY_COLORS = {
  Food: "#3b82f6",
  Transport: "#10b981",
  Utilities: "#f59e42",
  Entertainment: "#f97316",
  Software: "#4a11d0ff",
  Shopping: "#a78bfa",
  Health: "#ef4444",
  Other: "#c208d2ff",
};
const getColor = (name) => CATEGORY_COLORS[name] || "#9CA3AF";

const categoryIconsMap = {
  Food: <FaUtensils />,
  Transport: <FaBus />,
  Utilities: <FaBolt />,
  Entertainment: <FaFilm />,
  Software: <FaLaptopCode />,
  Shopping: <FaShoppingBag />,
  Health: <FaHeartbeat />,
  Other: <FaEllipsisH />,
};

/* Canonical mapping:
   "FOOD", "food", "Food" -> "Food"
   ensures API data (now uppercase) still matches our labels/colors/icons
*/
const CANONICAL_CATEGORY = {
  FOOD: "Food",
  TRANSPORT: "Transport",
  UTILITIES: "Utilities",
  ENTERTAINMENT: "Entertainment",
  SOFTWARE: "Software",
  SHOPPING: "Shopping",
  HEALTH: "Health",
  OTHER: "Other",
};

/* UI order (pretty labels) */
const ALL_CATEGORIES = [
  "Food",
  "Transport",
  "Utilities",
  "Entertainment",
  "Software",
  "Shopping",
  "Health",
  "Other",
];

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* Tooltip (shows REAL value) */
const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload; // has { value, renderValue, ... }
  return (
    <div className="bg-white border border-gray-200 rounded px-2 py-1 shadow text-xs">
      <div className="font-semibold text-gray-700">{d.name}</div>
      <div className="text-gray-500">
        ₹{Number(d.value ?? 0).toLocaleString()}
      </div>
    </div>
  );
};

/* Active slice style */
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export default function CategoryPieChart() {
  const dispatch = useDispatch();
  const selectedCategory = useSelector(selectSelectedCategory);
  const pieData = useSelector(selectPieData);
  const status = useSelector((s) => s.categoryPie.status);
  const error = useSelector((s) => s.categoryPie.error);

  const currentYear = new Date().getFullYear();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(null);

  const recentYears = useMemo(() => {
    const startYear = 2020;
    return Array.from(
      { length: currentYear - startYear + 1 },
      (_, i) => startYear + i
    ).reverse();
  }, [currentYear]);

  // Dedup / cancel stale fetches
  const inFlightCtl = useRef(null);
  const lastKeyRef = useRef("");

  async function runFetch(nextYear, nextMonth) {
    const key = `${nextYear}:${nextMonth ?? ""}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    if (inFlightCtl.current) inFlightCtl.current.abort("stale");
    inFlightCtl.current = new AbortController();

    dispatch(setPieType(nextMonth ? "Month" : "Year"));
    dispatch(clearSelectedCategory());

    try {
      await dispatch(
        fetchCategoryPie({
          year: nextYear,
          ...(nextMonth ? { month: nextMonth } : {}),
          signal: inFlightCtl.current.signal,
        })
      ).unwrap();
    } catch {
      // rejected handled in slice; toast handled in useEffect below
    }
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if (year && month) runFetch(year, month);
      else if (year) runFetch(year, null);
    }, 200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  // 🔔 Toast when category pie API fails, but ignore 404
  useEffect(() => {
    if (status !== "failed") return;

    const raw = String(error || "");
    if (raw.includes("404")) {
      // ignore "Not Found" errors for this chart
      return;
    }

    const msg = raw || "Internal error while loading category-wise expenses.";

    toast(msg, {
      ...TOAST_BASE,
      style: STYLE_ERROR,
      icon: false,
    });
  }, [status, error]);

  // close dropdown on outside click
  const menuRef = useRef(null);
  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setDropdownOpen(false);
    }
    if (dropdownOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [dropdownOpen]);

  const openLabel = `${year} • ${
    month ? MONTH_LABELS[month - 1] : "All Months"
  }`;

  /* --- Normalize & map API categories to canonical labels --- */
  const normalized = useMemo(() => {
    const byName = Object.create(null);

    (pieData || []).forEach((d) => {
      if (!d) return;
      const rawName = String(d.name ?? d.category ?? "Other");
      const upper = rawName.toUpperCase();
      const canonical =
        CANONICAL_CATEGORY[upper] || CANONICAL_CATEGORY.OTHER || "Other";

      if (!byName[canonical]) {
        byName[canonical] = { value: 0, tx_count: 0 };
      }

      byName[canonical].value += Number(d.value ?? d.amount ?? d.total ?? 0);
      byName[canonical].tx_count += Number(d.tx_count ?? 0);
    });

    return ALL_CATEGORIES.map((name) => ({
      name,
      value: Number(byName?.[name]?.value ?? 0),
      tx_count: Number(byName?.[name]?.tx_count ?? 0),
    }));
  }, [pieData]);

  const totalReal = normalized.reduce((s, d) => s + (Number(d.value) || 0), 0);

  // ensure visible slice even when value is 0
  const epsilon = totalReal > 0 ? Math.max(totalReal * 0.0005, 0.000001) : 1;

  const displayData = normalized.map((d) => ({
    ...d,
    renderValue: d.value > 0 ? d.value : epsilon,
  }));

  /* ======== Autoplay highlight (cycles through ALL categories) ======== */
  const [activeIndex, setActiveIndex] = useState(displayData.length ? 0 : -1);
  const [pause, setPause] = useState(false);
  const autoplayRef = useRef(null);

  useEffect(() => {
    setActiveIndex(displayData.length ? 0 : -1);
  }, [displayData.length, year, month]);

  useEffect(() => {
    if (pause || displayData.length <= 1) return;
    autoplayRef.current && clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % displayData.length);
    }, 2000);
    return () => clearInterval(autoplayRef.current);
  }, [pause, displayData.length]);

  const onSliceEnter = (_, idx) => {
    setPause(true);
    setActiveIndex(idx);
  };

  return (
    <div
      className="
        bg-white shadow-lg rounded-xl p-6 w-full mx-auto mb-8
        flex flex-col
        text-slate-800 dark:text-slate-100
        md:h-auto
        overflow-visible
        max-[320px]:p-4 max-[320px]:border max-[320px]:border-slate-200 max-[320px]:shadow-none
      "
    >
      {/* Header */}
      <div
        className="flex items-center justify-between mb-3 max-[380px]:flex-wrap max-[380px]:gap-2"
        ref={menuRef}
      >
        <h3 className="font-semibold text-[14px] text-gray-700">
          Category Wise
        </h3>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setDropdownOpen((d) => !d)}
            className="px-2 py-1.5 bg-sky-600 text-white rounded-full text-xs font-semibold flex items-center gap-1"
          >
            Year &amp; Month
            <FaChevronDown
              className={`transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div className="text-sm text-gray-700 font-medium">{openLabel}</div>

          {/* Dropdown */}
          <div
            className={`absolute right-0 top-8 bg-white border rounded shadow transition-all duration-150 origin-top ${
              dropdownOpen
                ? "scale-100 opacity-100 pointer-events-auto"
                : "scale-95 opacity-0 pointer-events-none"
            }`}
            style={{ zIndex: 40, width: "min(520px,100%)" }}
          >
            <div className="flex">
              {/* Years */}
              <div className="w-1/2 border-r max-h-64 overflow-auto">
                <div className="px-3 py-2 text-xs font-semibold text-gray-700">
                  Year
                </div>
                {recentYears.map((y) => (
                  <div
                    key={y}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                      year === y ? "font-bold text-blue-600" : "text-gray-700"
                    }`}
                    onClick={() => setYear(y)}
                  >
                    {y}
                  </div>
                ))}
              </div>

              {/* Months */}
              <div className="w-1/2 max-h-64 overflow-auto">
                <div className="px-3 py-2 text-xs font-semibold text-gray-700">
                  Month
                </div>
                {MONTH_LABELS.map((label, idx) => {
                  const m = idx + 1;
                  return (
                    <div
                      key={label}
                      className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                        month === m
                          ? "font-bold text-blue-600"
                          : "text-gray-700"
                      }`}
                      onClick={() => {
                        setMonth(m);
                        setDropdownOpen(false);
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
              <div className="text-xs text-gray-600">
                Selected:{" "}
                <span className="font-medium text-gray-800">{year}</span>
                <span className="ml-2 font-medium text-gray-800">
                  • {month ? MONTH_LABELS[month - 1] : ""}
                </span>
              </div>
              <button
                onClick={() => {
                  setYear(currentYear);
                  setMonth(null);
                }}
                className="text-xs px-3 py-1 rounded-full bg-gray-200 text-gray-800 font-semibold"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Legend */}
      <div className="flex items-center mt-1 gap-3">
        <div
          className="relative w-[120px] h-[120px]"
          onMouseEnter={() => setPause(true)}
          onMouseLeave={() => setPause(false)}
        >
          {/* Center total (REAL total) */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="flex flex-col items-center leading-tight">
              <span className="text-[10px] text-gray-500">Amount</span>
              <span className="text-[14px] font-bold text-gray-800">
                ₹{Number(totalReal || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {status === "loading" && (
            <div className="absolute inset-0 grid place-items-center bg-white/60 rounded">
              <span className="text-[11px] text-gray-500">Loading…</span>
            </div>
          )}

          <ResponsiveContainer width={125} height={125}>
            <PieChart>
              <Pie
                data={displayData}
                dataKey="renderValue"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={55}
                labelLine={false}
                label={false}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onSliceEnter}
              >
                {displayData.map((d) => (
                  <Cell key={d.name} fill={getColor(d.name)} />
                ))}
              </Pie>
              <Tooltip content={CustomPieTooltip} isAnimationActive={false} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        {(() => {
          const leftFour = ALL_CATEGORIES.slice(0, 4);
          const rightFour = ALL_CATEGORIES.slice(4, 8);

          const Item = ({ name }) => (
            <div className="flex items-center text-[10px] leading-none">
              <span
                className="inline-grid place-items-center w-4 h-4 rounded-full bg-slate-100 text-slate-700 mr-6"
                style={{
                  color: getColor(name),
                  border: `1px solid ${getColor(name)}22`,
                  backgroundColor: "#F8FAFC",
                }}
              >
                {categoryIconsMap[name] ?? categoryIconsMap.Other}
              </span>
              <span className="text-slate-700 font-medium">{name}</span>
            </div>
          );

          return (
            <>
              {/* Mobile: 1 column */}
              <div className="flex flex-col gap-2 w-full sm:hidden">
                {ALL_CATEGORIES.map((n) => (
                  <Item key={n} name={n} />
                ))}
              </div>

              {/* ≥sm: 2 columns */}
              <div className="hidden sm:flex gap-4">
                <div className="flex flex-col gap-2">
                  {leftFour.map((n) => (
                    <Item key={n} name={n} />
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {rightFour.map((n) => (
                    <Item key={n} name={n} />
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Rows */}
      <div className="mt-1 space-y-1">
        {normalized.map((cat) => {
          const color = getColor(cat.name);
          const icon = categoryIconsMap[cat.name] ?? categoryIconsMap.Other;
          const selected = selectedCategory === cat.name;
          return (
            <div
              key={cat.name}
              onClick={() =>
                dispatch(setSelectedCategory(selected ? null : cat.name))
              }
              className={`flex items-center py-1 px-1 pl-3 pr-3 rounded-md cursor-pointer text-xs transition ${
                selected ? "bg-blue-50 border border-blue-300" : ""
              } ${cat.value === 0 ? "opacity-80" : ""}`}
            >
              <div className="flex items-center gap-1">
                <span className="text-lg" style={{ color }}>
                  {icon}
                </span>
                <div className="flex flex-col">
                  <div className="font-semibold text-gray-700 truncate">
                    {cat.name}
                  </div>
                  <div className="text-[8px] text-gray-500">
                    {Number(cat.tx_count ?? 0)} Transactions
                  </div>
                </div>
              </div>
              <div className="font-bold text-gray-700 whitespace-nowrap ml-auto">
                ₹{Number(cat.value ?? 0).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
