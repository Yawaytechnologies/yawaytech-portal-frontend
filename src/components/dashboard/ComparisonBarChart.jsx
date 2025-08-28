// src/components/dashboard/TrendChartDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaChevronDown } from "react-icons/fa";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchComparisonBar,
} from "../../redux/actions/comparisonBarActions";
import {
  selectCBTab,
  selectCBYears,
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

/* Keep your tooltip style exactly */
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

export default function TrendChartDashboard() {
  const dispatch = useDispatch();

  // Redux state (mirrors your original local state)
  const tab = useSelector(selectCBTab);
  const years = useSelector(selectCBYears);
  const months = useSelector(selectCBMonths);

  const selectedYear = useSelector(selectCBSelectedYear);
  const selectedMonth = useSelector(selectCBSelectedMonth);
  const yearPage = useSelector(selectCBYearPage);
  const monthPage = useSelector(selectCBMonthPage);

  const status = useSelector(selectCBStatus);
  const error = useSelector(selectCBError);

  const { data: chartData, xKey } = useSelector(selectCBVisibleChart);
  const totalAmount = useSelector(selectCBVisibleTotal);

  // Dropdown local toggles (UI only)
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [showMonthFilter, setShowMonthFilter] = useState(false);

  /* Fetch data on first mount & whenever the driving inputs change */
  useEffect(() => {
    if (tab === "Year") {
      dispatch(fetchComparisonBar({ period: "Year", year: selectedYear }));
    }
  }, [dispatch, tab, selectedYear]);

  useEffect(() => {
    if (tab === "Month") {
      dispatch(fetchComparisonBar({ period: "Month", year: selectedYear, month: selectedMonth }));
    }
  }, [dispatch, tab, selectedYear, selectedMonth]);

  /* Handlers keep your UI behavior exactly */
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

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-0 pb-4">
      {/* --- Header with selection controls --- */}
      <div className="flex items-center justify-between pt-4 px-6 pb-1">
        {/* Tabs: Year, Month */}
        <div className="flex gap-2">
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all
              ${tab === "Year" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => {
              dispatch(setTab("Year"));
              setShowMonthFilter(false);
            }}
          >
            Year
          </button>
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all
              ${tab === "Month" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => {
              dispatch(setTab("Month"));
              setShowYearFilter(false);
            }}
          >
            Month
          </button>
        </div>

        {/* Year/Month Dropdown at right (animated dropdown) */}
        <div className="relative z-10">
          {tab === "Year" ? (
            <>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded shadow text-xs font-semibold focus:outline-none flex items-center gap-1 ml-2"
                onClick={() => setShowYearFilter((f) => !f)}
                type="button"
              >
                {selectedYear}
                <span className={`transition-transform duration-200 ${showYearFilter ? "rotate-180" : ""}`}>
                  <FaChevronDown size={12} />
                </span>
              </button>
              <div
                className={`absolute right-0 mt-2 w-20 bg-white border rounded shadow transition-all duration-200 origin-top
                  ${showYearFilter ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"}`}
              >
                {years.map((y) => (
                  <div
                    key={y}
                    className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 ${
                      y === selectedYear ? "font-bold text-blue-600" : "text-gray-700"
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
                className="px-3 py-1 bg-blue-600 text-white rounded shadow text-xs font-semibold focus:outline-none flex items-center gap-1 ml-2"
                onClick={() => setShowMonthFilter((f) => !f)}
                type="button"
              >
                {selectedMonth}
                <span className={`transition-transform duration-200 ${showMonthFilter ? "rotate-180" : ""}`}>
                  <FaChevronDown size={12} />
                </span>
              </button>
              <div
                className={`absolute right-0 mt-2 w-24 bg-white border rounded shadow transition-all duration-200 origin-top
                  ${showMonthFilter ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"}`}
              >
                {months.map((m) => (
                  <div
                    key={m}
                    className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 ${
                      m === selectedMonth ? "font-bold text-blue-600" : "text-gray-700"
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

      {/* (optional) inline load/error note—no style changes to chart/pills */}
      {status === "failed" && (
        <div className="px-6 text-xs text-red-600">Failed to load: {error}</div>
      )}

      {/* --- Total Amount pill left top below chart --- */}
      <div className="w-full flex flex-col items-center mt-2 mb-2 px-4">
        <div
          className="px-5 py-1 rounded-full shadow text-xs font-bold text-white flex items-center"
          style={{
            background: "linear-gradient(90deg, #1568f2 40%, #24d0ef 100%)",
            letterSpacing: "0.03em",
            fontSize: "15px",
            marginBottom: 1,
            marginLeft: 0,
            marginTop: 0,
          }}
        >
          <span style={{ fontWeight: 500, marginRight: 7 }}>Total amount</span>
          <span style={{ fontWeight: 400 }}>
            ₹{Number(totalAmount || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* --- Chart --- */}
      <div className="px-2 pt-0 pb-2">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={chartData}
            margin={{ top: 16, right: 30, left: 10, bottom: 0 }}
            padding={{ left: 20, right: 20 }} // keep your comment + prop
          >
            <defs>
              <linearGradient id="blue-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D70FA" stopOpacity={0.58} />
                <stop offset="65%" stopColor="#3784fa" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3784fa" stopOpacity={0.06} />
              </linearGradient>
              <linearGradient id="vertical-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#bae6fd" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#ececec" />
            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              fontSize={14}
              tick={{ fill: "#AAB2C8" }}
              interval={0}
              padding={{ left: 15, right: 15 }}
            />
            <YAxis axisLine={false} tickLine={false} tick={false} label={false} width={18} />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: "4 4", stroke: "#2563eb", strokeWidth: 1.5 }}
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
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* --- Pagination for Month view --- */}
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

      {/* --- Pagination for Year view (6 at a time) --- */}
      {tab === "Year" && (
        <div className="flex items-center justify-center gap-6 mt-2">
          <button
            className="rounded-full p-2 hover:bg-blue-100 transition disabled:opacity-40"
            disabled={yearPage === 0}
            onClick={() => dispatch(setYearPage(Math.max(yearPage - 1, 0)))}
          >
            <FiChevronLeft className="text-blue-800 text-xl" />
          </button>
          <span className="text-gray-500 text-sm">{`Showing ${yearPage * 6 + 1}-${Math.min(yearPage * 6 + 6, 12)} / 12 months`}</span>
          <button
            className="rounded-full p-2 hover:bg-blue-100 transition disabled:opacity-40"
            disabled={yearPage === 1}
            onClick={() => dispatch(setYearPage(Math.min(yearPage + 1, 1)))}
          >
            <FiChevronRight className="text-blue-800 text-xl" />
          </button>
        </div>
      )}
    </div>
  );
}
