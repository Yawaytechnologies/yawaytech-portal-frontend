// src/components/dashboard/SummaryCards.jsx
import React, { useEffect, useRef, useState } from "react";
import { MdCurrencyRupee, MdCalendarMonth, MdBarChart } from "react-icons/md";
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

  const cards = [
    {
      label: "Total Expenses",
      value: animatedTotal,
      icon: <MdCurrencyRupee size={22} />,
      iconBg: "bg-[#FF5800]/10",
      iconColor: "text-[#FF5800]",
      borderColor: "border-t-[#FF5800]",
      valueColor: "text-[#FF5800]",
    },
    {
      label: "This Month",
      value: animatedMonth,
      icon: <MdCalendarMonth size={22} />,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-500",
      borderColor: "border-t-indigo-500",
      valueColor: "text-indigo-600",
    },
    {
      label: "This Year",
      value: animatedYear,
      icon: <MdBarChart size={22} />,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      borderColor: "border-t-emerald-500",
      valueColor: "text-emerald-600",
      extra: "mx-auto sm:mx-0 w-full sm:w-auto",
    },
  ];

  return (
    <div className="flex gap-4 mb-6 flex-wrap">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`flex-1 min-w-[140px] bg-white rounded-2xl border border-slate-100 border-t-4 ${c.borderColor} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 px-5 py-4 select-none cursor-default ${c.extra || ""}`}
          title={status === "loading" ? "Loading…" : undefined}
          role="presentation"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.iconBg} ${c.iconColor}`}>
              {c.icon}
            </div>
          </div>
          <div className={`text-2xl font-bold ${c.valueColor}`}>
            ₹{Number(c.value || 0).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
