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

export default function SummaryCards() {
  const dispatch = useDispatch();

  const totals = useSelector(selectSummaryTotals) || {
    total: 0,
    month: 0,
    year: 0,
  };
  const status = useSelector(selectSummaryStatus);

  // Fetch once on mount
  const didFetch = useRef(false);
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    dispatch(fetchSummaryCards({}));
  }, [dispatch]);

  // Optional: refresh when window regains focus
  useEffect(() => {
    const onFocus = () => dispatch(fetchSummaryCards({}));
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [dispatch]);

  // Animated numbers
  const animatedTotal = useCountUp(Number(totals.total || 0));
  const animatedMonth = useCountUp(Number(totals.month || 0));
  const animatedYear = useCountUp(Number(totals.year || 0));

  const cardGradients = [
    "bg-gradient-to-br from-blue-400 via-blue-200 to-blue-50",
    "bg-gradient-to-br from-blue-400 via-blue-200 to-blue-50",
    "bg-gradient-to-br from-blue-400 via-blue-200 to-blue-50",
  ];

  // 🔥 Hover-only styling (no clicks): lift + glow, smooth transition
  const cardBase =
    "rounded-lg px-4 py-3 flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center " +
    "bg-white/0 shadow transition-transform transition-shadow duration-200 ease-out " +
    "hover:shadow-xl hover:scale-[1.03] hover:-translate-y-0.5 " +
    "focus-within:shadow-xl select-none cursor-default";

  return (
    <div className="flex gap-3 mb-6 flex-wrap">
      {/* Total */}
      <div
        className={`${cardBase} ${cardGradients[0]}`}
        title={status === "loading" ? "Loading…" : undefined}
        role="presentation"
      >
        <div className="text-xs text-blue-900 font-medium mb-1">
          Total Expenses
        </div>
        <div className="text-base font-medium text-black">
          ₹{Number(animatedTotal || 0).toLocaleString()}
        </div>
      </div>

      {/* This Month */}
      <div
        className={`${cardBase} ${cardGradients[1]}`}
        title={status === "loading" ? "Loading…" : undefined}
        role="presentation"
      >
        <div className="text-xs text-blue-900 font-medium mb-1">
          This Month Expenses
        </div>
        <div className="text-base font-medium text-black">
          ₹{Number(animatedMonth || 0).toLocaleString()}
        </div>
      </div>

      {/* This Year */}
      <div
        className={`${cardBase} ${cardGradients[2]} mx-auto sm:mx-0 w-full sm:w-auto`}
        title={status === "loading" ? "Loading…" : undefined}
        role="presentation"
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
