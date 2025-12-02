// src/components/ComparisonBarChart.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaChevronDown } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toast, Slide } from "react-toastify";

import {
  fetchComparisonBar,
  fetchMonthTotal,
} from "../../redux/actions/comparisonBarActions";

import {
  selectCBTab,
  // selectCBYears, // removed – now we generate years locally
  selectCBMonths,
  selectCBSelectedYear,
  selectCBSelectedMonth,
  selectCBYearPage,
  selectCBMonthPage,
  selectCBStatus,
  selectCBError,
  selectCBVisibleChart,
  selectCBVisibleTotal,
  setTab,
  setSelectedYear,
  setSelectedMonth,
  setYearPage,
  setMonthPage,
} from "../../redux/reducer/comparisonBarSlice";

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

/* ---------------- constants + helpers ---------------- */

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const monthLabelToNumber = (m) => {
  if (typeof m === "number") return m;
  const idx = MONTH_LABELS.indexOf(String(m).slice(0, 3));
  return idx >= 0 ? idx + 1 : undefined;
};

/** YEAR: normalize sparse rows into a full 12-month series. */
const build12MonthSeries = (rows = []) => {
  const series = Array.from({ length: 12 }, (_, i) => ({
    label: MONTH_LABELS[i],
    value: 0,
  }));
  for (const r of rows) {
    const m =
      (typeof r.month === "number" && r.month) || monthLabelToNumber(r.label);
    const v = Number(r.total ?? r.value ?? 0);
    if (m >= 1 && m <= 12) series[m - 1].value = v;
  }
  return series;
};

/** MONTH: normalize to however many weeks backend returns (W1..W4/5/6). */
const buildWeekSeriesDynamic = (rows = []) => {
  // find max week number present (default to 4 if none)
  let maxW = 0;
  for (const r of rows) {
    const raw = r.week ?? r.week_no ?? r.index ?? r.label ?? r.name;
    let n;
    if (typeof raw === "number") n = raw;
    else if (typeof raw === "string") {
      const m = raw.match(/(\d+)/);
      n = m ? parseInt(m[1], 10) : undefined;
    }
    if (n && n > maxW) maxW = n;
  }
  if (!maxW) maxW = 4;

  const series = Array.from({ length: maxW }, (_, i) => ({
    week: i + 1,
    label: `W${i + 1}`,
    value: 0,
  }));

  for (const r of rows) {
    const raw = r.week ?? r.week_no ?? r.index ?? r.label ?? r.name;
    let w;
    if (typeof raw === "number") w = raw;
    else if (typeof raw === "string") {
      const m = raw.match(/(\d+)/);
      w = m ? parseInt(m[1], 10) : undefined;
    }
    const v = Number(r.value ?? r.total ?? r.amount ?? 0);
    if (w >= 1 && w <= maxW) series[w - 1].value = v;
  }
  return series;
};

// Keep Year Y scale consistent across halves
const FIXED_YEAR_Y_MAX = 7000;

/* ---------------- tooltip ---------------- */

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded shadow text-center border border-blue-200">
        <div className="text-xs text-gray-600 font-semibold">{label}</div>
        <div className="font-bold text-blue-700 text-base">
          ₹{Number(payload[0].value || 0).toLocaleString()}
        </div>
      </div>
    );
  }
  return null;
}

/* ---------------- component ---------------- */

export default function ComparisonBarChart() {
  const dispatch = useDispatch();

  // Redux state
  const tab = useSelector(selectCBTab);
  const months = useSelector(selectCBMonths);
  const selectedYear = useSelector(selectCBSelectedYear);
  const selectedMonth = useSelector(selectCBSelectedMonth);
  const yearPage = useSelector(selectCBYearPage); // 0 -> 1–6, 1 -> 7–12
  const monthPage = useSelector(selectCBMonthPage);
  const status = useSelector(selectCBStatus);
  const error = useSelector(selectCBError);
  const { data: visibleData = [] } = useSelector(selectCBVisibleChart);
  const totalAmount = useSelector(selectCBVisibleTotal);

  // 👇 auto-generate years from 2020 → current year (descending)
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const startYear = 2020;
    return Array.from(
      { length: currentYear - startYear + 1 },
      (_, i) => currentYear - i
    );
  }, [currentYear]);

  // UI
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [showMonthFilter, setShowMonthFilter] = useState(false);

  const selectedMonthNumber = useMemo(
    () => monthLabelToNumber(selectedMonth),
    [selectedMonth]
  );

  // 🔔 Toast on chart API failure, but skip 404
  useEffect(() => {
    if (status !== "failed") return;

    const raw = String(error || "");
    if (raw.includes("404")) {
      // ignore 404 Not Found for this chart
      return;
    }

    const msg = raw || "Internal error while loading expenses chart.";

    toast(msg, {
      ...TOAST_BASE,
      style: STYLE_ERROR,
      icon: false,
    });
  }, [status, error]);

  // Fetch data
  useEffect(() => {
    if (tab === "Year" && selectedYear) {
      dispatch(fetchComparisonBar({ period: "Year", year: selectedYear }));
    }
  }, [dispatch, tab, selectedYear]);

  useEffect(() => {
    if (tab === "Month" && selectedYear && selectedMonthNumber) {
      dispatch(
        fetchComparisonBar({
          period: "Month",
          year: selectedYear,
          month: selectedMonth,
        })
      );
      dispatch(fetchMonthTotal({ year: selectedYear, month: selectedMonth }));
    }
  }, [dispatch, tab, selectedYear, selectedMonthNumber, selectedMonth]);

  const handleYearChange = (y) => {
    dispatch(setSelectedYear(y));
    setShowYearFilter(false);
  };
  const handleMonthChange = (m) => {
    dispatch(setSelectedMonth(m));
    setShowMonthFilter(false);
  };

  const handlePrevMonth = () => {
    if (monthPage > 0) dispatch(setMonthPage(monthPage - 1));
  };
  const handleNextMonth = () => {
    if (monthPage < months.length - 1) dispatch(setMonthPage(monthPage + 1));
  };

  /* ---------------- transforms for charts ---------------- */

  // YEAR: normalize to 12 then split 1–6 / 7–12
  const year12Data = useMemo(
    () => (tab === "Year" ? build12MonthSeries(visibleData) : []),
    [tab, visibleData]
  );
  const yearChartData = useMemo(
    () =>
      tab === "Year"
        ? yearPage === 0
          ? year12Data.slice(0, 6)
          : year12Data.slice(6, 12)
        : [],
    [tab, yearPage, year12Data]
  );

  // MONTH: dynamic weeks (W1..W4/5/6)
  const monthWeekData = useMemo(
    () => (tab === "Month" ? buildWeekSeriesDynamic(visibleData) : []),
    [tab, visibleData]
  );

  // Month Y scale from all plotted weeks
  const monthYMax = useMemo(() => {
    if (tab !== "Month" || !monthWeekData.length) return undefined;
    const maxVal = Math.max(...monthWeekData.map((d) => Number(d.value || 0)));
    return maxVal > 0 ? Math.ceil(maxVal * 1.1) : 0;
  }, [tab, monthWeekData]);

  // Dataset + x key (both use 'label' now)
  const chartData = tab === "Year" ? yearChartData : monthWeekData;
  const axisKey = "label";

  // Pill total comes from selector (which sums weeks first, then falls back)
  const totalForPill = Number(totalAmount || 0);

  /* ---------------- render ---------------- */

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-0 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 px-6 pb-1">
        <div className="flex gap-2">
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
              tab === "Year"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => {
              dispatch(setTab("Year"));
              setShowMonthFilter(false);
            }}
          >
            Year
          </button>
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
              tab === "Month"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => {
              dispatch(setTab("Month"));
              setShowYearFilter(false);
            }}
          >
            Month
          </button>
        </div>

        {/* Filters */}
        <div className="relative z-10">
          {tab === "Year" ? (
            <>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded shadow text-xs font-semibold flex items-center gap-1"
                onClick={() => setShowYearFilter((f) => !f)}
                type="button"
              >
                {selectedYear}
                <span
                  className={`transition-transform duration-200 ${
                    showYearFilter ? "rotate-180" : ""
                  }`}
                >
                  <FaChevronDown size={12} />
                </span>
              </button>
              <div
                className={`absolute right-0 mt-2 w-20 bg-white border rounded shadow transition-all duration-200 origin-top ${
                  showYearFilter
                    ? "scale-100 opacity-100 pointer-events-auto"
                    : "scale-95 opacity-0 pointer-events-none"
                }`}
              >
                {years.map((y) => (
                  <div
                    key={y}
                    className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 ${
                      y === selectedYear
                        ? "font-bold text-blue-600"
                        : "text-gray-700"
                    }`}
                    onClick={() => handleYearChange(y)}
                  >
                    {y}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded shadow text-xs font-semibold flex items-center gap-1"
                onClick={() => setShowMonthFilter((f) => !f)}
                type="button"
              >
                {selectedMonth}
                <span
                  className={`transition-transform duration-200 ${
                    showMonthFilter ? "rotate-180" : ""
                  }`}
                >
                  <FaChevronDown size={12} />
                </span>
              </button>
              <div
                className={`absolute right-0 mt-2 w-28 bg-white border rounded shadow transition-all duration-200 origin-top ${
                  showMonthFilter
                    ? "scale-100 opacity-100 pointer-events-auto"
                    : "scale-95 opacity-0 pointer-events-none"
                }`}
              >
                {MONTH_LABELS.map((m) => (
                  <div
                    key={m}
                    className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 ${
                      m === selectedMonth
                        ? "font-bold text-blue-600"
                        : "text-gray-700"
                    }`}
                    onClick={() => handleMonthChange(m)}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Total pill */}
      <div className="w-full flex flex-col items-center mt-2 mb-2 px-4">
        <div
          className="px-5 py-1 rounded-full shadow text-xs font-bold text-white flex items-center"
          style={{
            background: "linear-gradient(90deg, #1568f2 40%, #24d0ef 100%)",
            letterSpacing: "0.03em",
            fontSize: "15px",
            marginBottom: 1,
          }}
        >
          <span style={{ fontWeight: 500, marginRight: 7 }}>Total amount</span>
          <span style={{ fontWeight: 400 }}>
            ₹{totalForPill.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pt-0 pb-2">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={chartData}
            margin={{ top: 16, right: 30, left: 10, bottom: 0 }}
            padding={{ left: 20, right: 20 }}
          >
            <defs>
              <linearGradient id="blue-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D70FA" stopOpacity={0.58} />
                <stop offset="65%" stopColor="#3784fa" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3784fa" stopOpacity={0.06} />
              </linearGradient>
              <linearGradient
                id="vertical-gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#bae6fd" />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              strokeDasharray="4 4"
              stroke="#ececec"
            />
            <XAxis
              dataKey={axisKey}
              axisLine={false}
              tickLine={false}
              fontSize={14}
              tick={{ fill: "#AAB2C8" }}
              interval={0}
              padding={{ left: 15, right: 15 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={false}
              width={18}
              domain={
                tab === "Year"
                  ? [0, FIXED_YEAR_Y_MAX]
                  : monthYMax !== undefined
                  ? [0, monthYMax]
                  : ["auto", "auto"]
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                strokeDasharray: "4 4",
                stroke: "#2563eb",
                strokeWidth: 1.5,
              }}
              wrapperStyle={{ zIndex: 20 }}
            />
            <Area
              type="monotone"
              dataKey={"value"}
              stroke="url(#vertical-gradient)"
              strokeWidth={2.4}
              fill="url(#blue-area)"
              activeDot={false}
              dot={false}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Month navigation */}
      {tab === "Month" && (
        <div className="flex items-center justify-center gap-6 mt-2">
          <button
            className="rounded-full p-2 hover:bg-blue-100 transition disabled:opacity-40"
            disabled={monthPage === 0}
            onClick={handlePrevMonth}
          >
            <FiChevronLeft className="text-blue-800 text-xl" />
          </button>
          <span className="text-gray-500 text-sm">
            {selectedMonth} {selectedYear}
          </span>
          <button
            className="rounded-full p-2 hover:bg-blue-100 transition disabled:opacity-40"
            disabled={monthPage === months.length - 1}
            onClick={handleNextMonth}
          >
            <FiChevronRight className="text-blue-800 text-xl" />
          </button>
        </div>
      )}

      {/* Year halves pager */}
      {tab === "Year" && (
        <div className="flex items-center justify-center gap-6 mt-2">
          <button
            className="rounded-full p-2 hover:bg-blue-100 transition disabled:opacity-40"
            disabled={yearPage === 0}
            onClick={() => dispatch(setYearPage(0))}
          >
            <FiChevronLeft className="text-blue-800 text-xl" />
          </button>
          <span className="text-gray-500 text-sm">
            {`Showing ${yearPage === 0 ? "1-6" : "7-12"} / 12 months`}
          </span>
          <button
            className="rounded-full p-2 hover:bg-blue-100 transition disabled:opacity-40"
            disabled={yearPage === 1}
            onClick={() => dispatch(setYearPage(1))}
          >
            <FiChevronRight className="text-blue-800 text-xl" />
          </button>
        </div>
      )}
    </div>
  );
}
