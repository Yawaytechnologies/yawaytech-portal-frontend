import React, { useState } from "react";
import SummaryCards from "../components/dashboard/SummaryCards";
import ComparisonBarChart from "../components/dashboard/ComparisonBarChart";
import CategoryPieChart from "../components/dashboard/CategoryPieChart";
import MonthlyExpenseDetail from "../components/dashboard/MonthlyExpenseDetail";
import YearlyExpenseDetail from "../components/dashboard/YearlyExpenseDetail";

export default function DashboardPage() {
  const [openDetail, setOpenDetail] = useState(null);

  // Dummy summary values (replace with API state)
  const total = 40850;
  const month = 3600;
  const year = 37250;

  return (
    <div className="min-h-screen bg-[#f6f8fa] px-3 py-6 font-medium">
      <div className="max-w-7xl mx-auto">
        {/* Make SummaryCards and ComparisonBarChart a column, then CategoryPieChart beside them */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT: Cards and Bar Chart in a column */}
          <div className="flex-1 flex flex-col gap-6">
            <SummaryCards
              total={total}
              month={month}
              year={year}
              onCardClick={setOpenDetail}
            />
            <ComparisonBarChart />
          </div>
          {/* RIGHT: CategoryPieChart */}
          <div className="w-full lg:w-[380px] flex-shrink-0 ">
            <CategoryPieChart />
          </div>
        </div>
        {/* Show modals for detail views */}
        {openDetail === "month" && (
          <MonthlyExpenseDetail onClose={() => setOpenDetail(null)} />
        )}
        {openDetail === "year" && (
          <YearlyExpenseDetail onClose={() => setOpenDetail(null)} />
        )}
        {/* Add a similar detail for 'total' if you want */}
      </div>
    </div>
  );
}
