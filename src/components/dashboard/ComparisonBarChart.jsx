import React, { useState } from "react";
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

// --- Example data ---
const years = [2021, 2022, 2023, 2024, 2025];
const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const monthlyDataSet = [
  Array.from({ length: 12 }, (_, i) => ({
    month: months[i],
    value: Math.round(Math.random() * 800 + 400),
  })),
  Array.from({ length: 12 }, (_, i) => ({
    month: months[i],
    value: Math.round(Math.random() * 800 + 400),
  })),
  Array.from({ length: 12 }, (_, i) => ({
    month: months[i],
    value: Math.round(Math.random() * 800 + 400),
  })),
  Array.from({ length: 12 }, (_, i) => ({
    month: months[i],
    value: Math.round(Math.random() * 800 + 400),
  })),
  Array.from({ length: 12 }, (_, i) => ({
    month: months[i],
    value: Math.round(Math.random() * 800 + 400),
  })),
];

// All months have Week 1 to Week 4
const getWeeksForMonth = (monthIdx) =>
  ["Week 1", "Week 2", "Week 3", "Week 4"].map((w, i) => ({
    week: w,
    value: Math.round(Math.random() * 500 + 400 + monthIdx * 10 + i * 30),
  }));

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded shadow text-center border border-blue-200">
        <div className="text-xs text-gray-600 font-semibold">{label}</div>
        <div className="font-bold text-blue-700 text-base">
          ₹{payload[0].value.toLocaleString()}
        </div>
      </div>
    );
  }
  return null;
}

export default function TrendChartDashboard() {
  const [tab, setTab] = useState("Year"); // "Year" or "Month"
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedMonth, setSelectedMonth] = useState("Feb");
  const [yearPage, setYearPage] = useState(0); // For pagination (6 at a time)
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [showMonthFilter, setShowMonthFilter] = useState(false);

  // For month pagination
  const [monthPage, setMonthPage] = useState(months.indexOf(selectedMonth));
  const selectedYearIdx = years.indexOf(selectedYear);

  // --- Data selection logic ---
  let chartData = [];
  let xKey = "";


  if (tab === "Year") {
    chartData = monthlyDataSet[selectedYearIdx].slice(
      yearPage * 6,
      yearPage * 6 + 6
    );
    xKey = "month";
  } else if (tab === "Month") {
    chartData = getWeeksForMonth(monthPage); // Always Weeks 1-4 for selected month
    xKey = "week";
  }

  // --- Total calculation for visible data ---
  const totalAmount = chartData.reduce((sum, d) => sum + d.value, 0);

  // --- Dropdown/Select controls ---
  const handleYearChange = (y) => {
    setSelectedYear(Number(y));
    setYearPage(0);
    setShowYearFilter(false);
  };
  const handleMonthChange = (m) => {
    setSelectedMonth(m);
    setMonthPage(months.indexOf(m));
    setShowMonthFilter(false);
  };

  // For month pagination
  const handlePrevMonth = () => {
    if (monthPage > 0) {
      const newMonth = monthPage - 1;
      setMonthPage(newMonth);
      setSelectedMonth(months[newMonth]);
    }
  };
  const handleNextMonth = () => {
    if (monthPage < months.length - 1) {
      const newMonth = monthPage + 1;
      setMonthPage(newMonth);
      setSelectedMonth(months[newMonth]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-0 pb-4">
      {/* --- Header with selection controls --- */}
      <div className="flex items-center justify-between pt-4 px-6 pb-1">
        {/* Tabs: Year, Month */}
        <div className="flex gap-2">
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all
              ${
                tab === "Year"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            onClick={() => {
              setTab("Year");
              setShowMonthFilter(false);
            }}
          >
            Year
          </button>
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all
              ${
                tab === "Month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            onClick={() => {
              setTab("Month");
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
                <span
                  className={`transition-transform duration-200 ${
                    showYearFilter ? "rotate-180" : ""
                  }`}
                >
                  <FaChevronDown size={12} />
                </span>
              </button>
              <div
                className={`absolute right-0 mt-2 w-20 bg-white border rounded shadow transition-all duration-200 origin-top
                  ${
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
                className="px-3 py-1 bg-blue-600 text-white rounded shadow text-xs font-semibold focus:outline-none flex items-center gap-1 ml-2"
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
                className={`absolute right-0 mt-2 w-24 bg-white border rounded shadow transition-all duration-200 origin-top
                  ${
                    showMonthFilter
                      ? "scale-100 opacity-100 pointer-events-auto"
                      : "scale-95 opacity-0 pointer-events-none"
                  }`}
              >
                {months.map((m) => (
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
            ₹{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* --- Chart --- */}
      <div className="px-2 pt-0 pb-2">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={chartData}
            margin={{ top: 16, right: 30, left: 10, bottom: 0 }}
            padding={{ left: 20, right: 20 }} // <-- this fixes label clipping!
          >
            <defs>
              {/* Much more dark & visible gradient */}
              <linearGradient id="blue-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D70FA" stopOpacity={0.58} />
                <stop offset="65%" stopColor="#3784fa" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3784fa" stopOpacity={0.06} />
              </linearGradient>
              {/* Strong vertical gradient for line */}
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
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              fontSize={14}
              tick={{ fill: "#AAB2C8" }}
              interval={0} // Force all ticks
              padding={{ left: 15, right: 15 }} // <-- This pushes labels in from the edge!
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={false} // Hides all values on the Y axis
              label={false}
              width={18}
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

      {/* --- Pagination for Year view: show left/right for 6 months at a time --- */}
      {tab === "Year" && (
        <div className="flex items-center justify-center gap-6 mt-2">
          <button
            className="rounded-full p-2 hover:bg-blue-100 transition disabled:opacity-40"
            disabled={yearPage === 0}
            onClick={() => setYearPage((prev) => Math.max(prev - 1, 0))}
          >
            <FiChevronLeft className="text-blue-800 text-xl" />
          </button>
          <span className="text-gray-500 text-sm">{`Showing ${
            yearPage * 6 + 1
          }-${Math.min(yearPage * 6 + 6, 12)} / 12 months`}</span>
          <button
            className="rounded-full p-2 hover:bg-blue-100 transition disabled:opacity-40"
            disabled={yearPage === 1}
            onClick={() => setYearPage((prev) => Math.min(prev + 1, 1))}
          >
            <FiChevronRight className="text-blue-800 text-xl" />
          </button>
        </div>
      )}
    </div>
  );
}
