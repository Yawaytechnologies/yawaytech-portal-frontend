import React, { useEffect, useState } from "react";

function useCountUp(end, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    let startTimestamp = null;
    let reqId;

    function step(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setValue(Math.floor(progress * (end - start) + start));
      if (progress < 1) {
        reqId = requestAnimationFrame(step);
      } else {
        setValue(end);
      }
    }
    reqId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(reqId);
  }, [end, duration]);

  return value;
}

export default function SummaryCards({ total, month, year, onCardClick }) {
  const animatedTotal = useCountUp(total);
  const animatedMonth = useCountUp(month);
  const animatedYear = useCountUp(year);

  const [active, setActive] = useState("");

  const cardGradients = [
    "bg-gradient-to-br from-blue-400 via-blue-200 to-blue-50", // Total
    "bg-gradient-to-br from-blue-400 via-blue-200 to-blue-50", // Month
    "bg-gradient-to-br from-blue-400 via-blue-200 to-blue-50", // Year
  ];

  // Helper to handle mobile tap visual feedback
  const handlePress = (key) => {
    setActive(key);
    setTimeout(() => setActive(""), 200);
    onCardClick(key);
  };

  return (
    <div className="flex gap-3 mb-6 flex-wrap">
      {/* Card 1: Total */}
      <div
        className={`shadow rounded-lg px-4 py-3 flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center cursor-pointer transition
        ${cardGradients[0]}
        hover:shadow-lg hover:scale-105 
        ${active === "total" ? "shadow-lg scale-105 ring-2 ring-blue-400" : ""}
        `}
        onClick={() => handlePress("total")}
        onTouchStart={() => setActive("total")}
        onTouchEnd={() => setActive("")}
      >
        <div className="text-xs text-blue-900 font-medium mb-1">
          Total Expenses
        </div>
        <div className="text-base font-medium text-black">
          ₹{animatedTotal.toLocaleString()}
        </div>
      </div>
      {/* Card 2: This Month */}
      <div
        className={`shadow rounded-lg px-4 py-3 flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center cursor-pointer transition
        ${cardGradients[1]}
        hover:shadow-lg hover:scale-105
        ${active === "month" ? "shadow-lg scale-105 ring-2 ring-blue-400" : ""}
        `}
        onClick={() => handlePress("month")}
        onTouchStart={() => setActive("month")}
        onTouchEnd={() => setActive("")}
      >
        <div className="text-xs text-blue-900 font-medium mb-1">
          This Month Expenses
        </div>
        <div className="text-base font-medium text-black">
          ₹{animatedMonth.toLocaleString()}
        </div>
      </div>
      {/* Card 3: This Year */}
      <div
        className={`shadow rounded-lg px-4 py-3 flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center cursor-pointer transition
        ${cardGradients[2]}
        hover:shadow-lg hover:scale-105
        ${active === "year" ? "shadow-lg scale-105 ring-2 ring-blue-400" : ""}
        mx-auto sm:mx-0 w-full sm:w-auto
        `}
        onClick={() => handlePress("year")}
        onTouchStart={() => setActive("year")}
        onTouchEnd={() => setActive("")}
      >
        <div className="text-xs text-blue-900 font-medium mb-1">
          This Year Expenses
        </div>
        <div className="text-base font-medium text-black">
          ₹{animatedYear.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
