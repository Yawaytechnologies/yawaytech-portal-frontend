// src/components/dashboard/CategoryPieChart.jsx
import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  FaUtensils,
  FaBus,
  FaPencilAlt,
  FaShoppingBag,
  FaHeartbeat,
  FaEllipsisH,
  FaChevronDown,
} from "react-icons/fa";

import { useDispatch, useSelector } from "react-redux";
import {
  selectPieType,
  selectSelectedCategory,
  selectPieData,
  selectTotalAmount,
  setPieType,
  setSelectedCategory,
  clearSelectedCategory,
  selectDataSourceForCurrent, // optional badge (api/dummy)
} from "../../redux/reducer/categoryPieSlice";
import { fetchCategoryPie } from "../../redux/actions/categoryPieActions";

/* ------------ UI constants ------------ */
const pieColors = ["#3b82f6", "#10b981", "#f59e42", "#a78bfa", "#ef4444", "#6366f1"];

const categoryIconsMap = {
  Food: <FaUtensils />,
  Transport: <FaBus />,
  Stationary: <FaPencilAlt />,
  Shopping: <FaShoppingBag />,
  Health: <FaHeartbeat />,
  Others: <FaEllipsisH />,
};

const filterOptions = ["Year", "Month", "Week"];

/* ------------ Custom tooltip (same look as before) ------------ */
const CustomPieTooltip = ({ active, payload, coordinate, chartWidth, chartHeight }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { x, y } = coordinate || { x: chartWidth / 2, y: chartHeight / 2 };
    const pieCenter = { x: chartWidth / 2, y: chartHeight / 2 };
    const OUTER_RADIUS = 55;
    const TOOLTIP_OFFSET = 25;
    const dx = x - pieCenter.x;
    const dy = y - pieCenter.y;
    const mag = Math.sqrt(dx * dx + dy * dy) || 1;
    const tooltipX = pieCenter.x + (dx / mag) * (OUTER_RADIUS + TOOLTIP_OFFSET);
    const tooltipY = pieCenter.y + (dy / mag) * (OUTER_RADIUS + TOOLTIP_OFFSET);

    return (
      <div
        style={{
          position: "absolute",
          pointerEvents: "none",
          left: tooltipX,
          top: tooltipY,
          zIndex: 20,
          transform: "translate(-50%,-50%)",
        }}
        className="bg-white border border-gray-200 rounded px-2 py-1 shadow text-xs"
      >
        <div className="font-semibold text-gray-700">{data.name}</div>
        <div className="text-gray-500">₹{data.value.toLocaleString()}</div>
      </div>
    );
  }
  return null;
};

export default function CategoryPieChart() {
  const dispatch = useDispatch();

  // Redux state
  const pieType = useSelector(selectPieType);
  const selectedCategory = useSelector(selectSelectedCategory);
  const pieData = useSelector(selectPieData);
  const totalAmount = useSelector(selectTotalAmount);
  const status = useSelector((s) => s.categoryPie.status);
  const dataSource = useSelector(selectDataSourceForCurrent); // "api" | "dummy"

  // Local UI state
  const [showFilter, setShowFilter] = useState(false);

  // Load for the current period (service handles API → dummy fallback)
  useEffect(() => {
    dispatch(fetchCategoryPie(pieType));
  }, [dispatch, pieType]);

  // Enrich with UI fields for list/legend
  const pieCategoryList = useMemo(
    () =>
      (pieData || []).map((cat, i) => ({
        ...cat,
        icon: categoryIconsMap[cat.name],
        color: pieColors[i % pieColors.length],
        transactions: Math.floor(cat.value / (pieType === "Year" ? 1000 : 100)),
        amount: cat.value,
      })),
    [pieData, pieType]
  );

  const filteredList = useMemo(
    () =>
      selectedCategory
        ? pieCategoryList.filter((c) => c.name === selectedCategory)
        : pieCategoryList,
    [selectedCategory, pieCategoryList]
  );

  return (
    <div
      className="
        bg-white shadow-lg rounded-xl p-6
        w-full max-w-[420px]
        mx-auto sm:ml-4 md:ml-0
        mb-8
        flex flex-col
        min-w-[320px]
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[16px] text-gray-700">Category Wise</h3>
          {/* Small badge to know if data is live or dummy */}
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              dataSource === "api" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}
            title={`Data source: ${dataSource}`}
          >
            {dataSource}
          </span>
        </div>

        <div className="relative z-10">
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded shadow text-xs font-semibold focus:outline-none flex items-center gap-1"
            onClick={() => setShowFilter((f) => !f)}
            disabled={status === "loading"}
          >
            {pieType}
            <span className={`transition-transform duration-200 cursor-pointer ${showFilter ? "rotate-180" : ""}`}>
              <FaChevronDown size={12} />
            </span>
          </button>
          <div
            className={`absolute right-0 mt-2 w-20 bg-white border rounded shadow transition-all duration-200 origin-top
              ${showFilter ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"}`}
          >
            {filterOptions.map((opt) => (
              <div
                key={opt}
                className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 ${
                  opt === pieType ? "font-bold text-blue-600" : "text-gray-700"
                }`}
                onClick={() => {
                  dispatch(setPieType(opt));
                  dispatch(clearSelectedCategory());
                  setShowFilter(false);
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart & Legend */}
      <div className="flex items-center mt-2 gap-6" style={{ position: "relative" }}>
        {/* Donut Chart */}
        <div className="relative w-[120px] h-[120px] ml-6">
          {/* Simple loading overlay */}
          {status === "loading" && (
            <div className="absolute inset-0 grid place-items-center bg-white/60 rounded">
              <span className="text-[11px] text-gray-500">Loading…</span>
            </div>
          )}

          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={55}
                labelLine={false}
                label={false}
              >
                {(pieData || []).map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                content={(props) => <CustomPieTooltip {...props} chartWidth={120} chartHeight={120} />}
                wrapperStyle={{ position: "absolute", zIndex: 100 }}
                isAnimationActive={false}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered amount */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-gray-400">Amount</span>
            <span className="text-[16px] font-bold text-gray-900 mt-1">
              ₹{Number(totalAmount || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Legend (dots only) */}
        <div className="flex flex-col gap-2 ml-2">
          {pieCategoryList.map((cat) => (
            <div key={cat.name} className="flex items-center text-xs">
              <span
                className="inline-block rounded-full"
                style={{ background: cat.color, width: 11, height: 11 }}
              />
              <span style={{ color: cat.color }} className="font-medium ml-2">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Listing */}
      <div className="mt-3 space-y-1">
        {filteredList.map((cat) => (
          <div
            key={cat.name}
            onClick={() => dispatch(setSelectedCategory(selectedCategory === cat.name ? null : cat.name))}
            className={`flex items-center py-1.5 px-2 pl-6 pr-6 rounded-md cursor-pointer text-xs transition
              ${selectedCategory === cat.name ? "bg-blue-50 border border-blue-300" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg" style={{ color: cat.color }}>
                {cat.icon}
              </span>
              <div>
                <div className="font-semibold text-gray-700 truncate">{cat.name}</div>
                <div className="text-[10px] text-gray-400 truncate">
                  {cat.transactions} Transactions
                </div>
              </div>
            </div>
            <div className="font-bold text-gray-700 whitespace-nowrap ml-auto">
              ₹{cat.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
