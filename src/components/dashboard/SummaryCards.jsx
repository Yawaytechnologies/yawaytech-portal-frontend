// src/components/dashboard/SummaryCards.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchSummaryCards } from "../../redux/actions/summaryCardsActions";
import {
  selectSummaryTotals,
  selectSummaryStatus,
  selectSummaryParams,
} from "../../redux/reducer/summaryCardsSlice";

// Use comparison bar's selection to parameterize the fetch (keeps dashboard in sync)
import {
  selectCBSelectedYear,
  selectCBSelectedMonth,
} from "../../redux/reducer/comparisonBarSlice";

function useCountUp(end, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0, startTimestamp = null, reqId;
    function step(ts) {
      if (!startTimestamp) startTimestamp = ts;
      const progress = Math.min((ts - startTimestamp) / duration, 1);
      setValue(Math.floor(progress * (end - start) + start));
      if (progress < 1) reqId = requestAnimationFrame(step);
      else setValue(end);
    }
    reqId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(reqId);
  }, [end, duration]);
  return value;
}

export default function SummaryCards({ total, month, year, onCardClick }) {
  const dispatch = useDispatch();

  // Parameters driven by comparison bar (so Month/Year switches reflect here)
  const selectedYear = useSelector(selectCBSelectedYear);
  const selectedMonth = useSelector(selectCBSelectedMonth);

  // Redux totals (with graceful fallback to props if provided)
  const reduxTotals = useSelector(selectSummaryTotals);
  const status = useSelector(selectSummaryStatus);
  const params = useSelector(selectSummaryParams);

  const tTotal = typeof total === "number" ? total : reduxTotals.total;
  const tMonth = typeof month === "number" ? month : reduxTotals.month;
  const tYear  = typeof year  === "number" ? year  : reduxTotals.year;

  // Fetch on mount and whenever selection changes
  useEffect(() => {
    // Avoid redundant fetch if params already match
    if (params.year !== selectedYear || params.month !== selectedMonth) {
      dispatch(fetchSummaryCards({ year: selectedYear, month: selectedMonth }));
    } else if (status === "idle") {
      dispatch(fetchSummaryCards({ year: selectedYear, month: selectedMonth }));
    }
  }, [dispatch, selectedYear, selectedMonth]); // keep as-is; slice prevents flicker

  const animatedTotal = useCountUp(tTotal);
  const animatedMonth = useCountUp(tMonth);
  const animatedYear  = useCountUp(tYear);

  const [active, setActive] = useState("");

  const cardGradients = [
    "bg-gradient-to-br from-blue-400 via-blue-200 to-blue-50",
    "bg-gradient-to-br from-blue-400 via-blue-200 to-blue-50",
    "bg-gradient-to-br from-blue-400 via-blue-200 to-blue-50",
  ];

  const handlePress = (key) => {
    setActive(key);
    setTimeout(() => setActive(""), 200);
    onCardClick?.(key);
  };

  return (
    <div className="flex gap-3 mb-6 flex-wrap">
      {/* Card 1: Total */}
      <div
        className={`shadow rounded-lg px-4 py-3 flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center cursor-pointer transition
        ${cardGradients[0]}
        hover:shadow-lg hover:scale-105 
        ${active === "total" ? "shadow-lg scale-105 ring-2 ring-blue-400" : ""}`}
        onClick={() => handlePress("total")}
        onTouchStart={() => setActive("total")}
        onTouchEnd={() => setActive("")}
        title={status === "loading" ? "Loading…" : undefined}
      >
        <div className="text-xs text-blue-900 font-medium mb-1">
          Total Expenses
        </div>
        <div className="text-base font-medium text-black">
          ₹{Number(animatedTotal || 0).toLocaleString()}
        </div>
      </div>

      {/* Card 2: This Month */}
      <div
        className={`shadow rounded-lg px-4 py-3 flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center cursor-pointer transition
        ${cardGradients[1]}
        hover:shadow-lg hover:scale-105
        ${active === "month" ? "shadow-lg scale-105 ring-2 ring-blue-400" : ""}`}
        onClick={() => handlePress("month")}
        onTouchStart={() => setActive("month")}
        onTouchEnd={() => setActive("")}
        title={status === "loading" ? "Loading…" : undefined}
      >
        <div className="text-xs text-blue-900 font-medium mb-1">
          This Month Expenses
        </div>
        <div className="text-base font-medium text-black">
          ₹{Number(animatedMonth || 0).toLocaleString()}
        </div>
      </div>

      {/* Card 3: This Year */}
      <div
        className={`shadow rounded-lg px-4 py-3 flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center cursor-pointer transition
        ${cardGradients[2]}
        hover:shadow-lg hover:scale-105
        ${active === "year" ? "shadow-lg scale-105 ring-2 ring-blue-400" : ""}
        mx-auto sm:mx-0 w-full sm:w-auto`}
        onClick={() => handlePress("year")}
        onTouchStart={() => setActive("year")}
        onTouchEnd={() => setActive("")}
        title={status === "loading" ? "Loading…" : undefined}
      >
        <div className="text-xs text-blue-900 font-medium mb-1">
          This Year Expenses
        </div>
        <div className="text-base font-medium text-black">
          ₹{Number(animatedYear || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
