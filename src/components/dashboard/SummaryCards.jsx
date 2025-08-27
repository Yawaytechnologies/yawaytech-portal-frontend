// src/components/dashboard/SummaryCards.jsx
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchSummaryCards } from "../../redux/actions/summaryCardsActions";
import {
  selectSummaryTotals,
  selectSummaryStatus,
} from "../../redux/reducer/summaryCardsSlice";

/* ---------------- Count-up hook ---------------- */
function useCountUp(end, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0,
      startTimestamp = null,
      reqId;
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

/**
 * Cards show:
 *  - Total Expenses (all-time)
 *  - This Month Expenses (current month)
 *  - This Year Expenses (current year)
 *
 * They are intentionally decoupled from any chart/selector state.
 */
export default function SummaryCards({ onCardClick }) {
  const dispatch = useDispatch();

  // Redux totals (API response)
  const totals = useSelector(selectSummaryTotals) || { total: 0, month: 0, year: 0 };
  const status = useSelector(selectSummaryStatus);

  // ✅ Fetch once on mount (guarded for React 18 StrictMode)
  const didFetch = useRef(false);
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    // No params -> backend uses "now" for month/year, and all-time for total
    dispatch(fetchSummaryCards({}));
  }, [dispatch]);

  // 🔄 Optional: refresh when tab regains focus
  useEffect(() => {
    const onFocus = () => dispatch(fetchSummaryCards({}));
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [dispatch]);

  // Animated numbers
  const animatedTotal = useCountUp(Number(totals.total || 0));
  const animatedMonth = useCountUp(Number(totals.month || 0));
  const animatedYear = useCountUp(Number(totals.year || 0));

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

  const cardBase =
    "shadow rounded-lg px-4 py-3 flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center cursor-pointer transition hover:shadow-lg hover:scale-105";

  return (
    <div className="flex gap-3 mb-6 flex-wrap">
      {/* Card 1: Total */}
      <div
        className={`${cardBase} ${cardGradients[0]} ${
          active === "total" ? "shadow-lg scale-105 ring-2 ring-blue-400" : ""
        }`}
        onClick={() => handlePress("total")}
        onTouchStart={() => setActive("total")}
        onTouchEnd={() => setActive("")}
        title={status === "loading" ? "Loading…" : undefined}
      >
        <div className="text-xs text-blue-900 font-medium mb-1">Total Expenses</div>
        <div className="text-base font-medium text-black">
          ₹{Number(animatedTotal || 0).toLocaleString()}
        </div>
      </div>

      {/* Card 2: This Month */}
      <div
        className={`${cardBase} ${cardGradients[1]} ${
          active === "month" ? "shadow-lg scale-105 ring-2 ring-blue-400" : ""
        }`}
        onClick={() => handlePress("month")}
        onTouchStart={() => setActive("month")}
        onTouchEnd={() => setActive("")}
        title={status === "loading" ? "Loading…" : undefined}
      >
        <div className="text-xs text-blue-900 font-medium mb-1">This Month Expenses</div>
        <div className="text-base font-medium text-black">
          ₹{Number(animatedMonth || 0).toLocaleString()}
        </div>
      </div>

      {/* Card 3: This Year */}
      <div
        className={`${cardBase} ${cardGradients[2]} ${
          active === "year" ? "shadow-lg scale-105 ring-2 ring-blue-400" : ""
        } mx-auto sm:mx-0 w-full sm:w-auto`}
        onClick={() => handlePress("year")}
        onTouchStart={() => setActive("year")}
        onTouchEnd={() => setActive("")}
        title={status === "loading" ? "Loading…" : undefined}
      >
        <div className="text-xs text-blue-900 font-medium mb-1">This Year Expenses</div>
        <div className="text-base font-medium text-black">
          ₹{Number(animatedYear || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
