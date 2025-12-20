import React, { useState } from "react";
import {
  RequestsPanel,
  PoliciesPanel,
  HolidaysPanel,
  WorkweekPanel,
} from "../components/leave-admin";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function AdminLeaveSuitePro() {
  const [tab, setTab] = useState("requests");

  const tabs = [
    { id: "requests", label: "Requests" },
    { id: "policies", label: "Policies" },
    { id: "holidays", label: "Holidays" },
    { id: "workweek", label: "Workweek" },
  ];

  return (
    <section className="px-4 py-5 sm:px-6 sm:py-6 md:px-10 md:py-8 lg:px-12 lg:py-10 text-slate-900">
      <header className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
            Leave Management — Admin
          </h1>
        </div>

        {/* tabs */}
        <nav
          className="w-full lg:w-auto rounded-xl bg-slate-100 p-1 flex flex-wrap gap-1 shadow-inner"
          role="tablist"
          aria-label="Leave admin sections"
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cx(
                  "flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium outline-none transition whitespace-nowrap",
                  active
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="grid gap-5 sm:gap-6 md:gap-8">
        {tab === "requests" && <RequestsPanel />}
        {tab === "policies" && <PoliciesPanel />}
        {tab === "holidays" && <HolidaysPanel />}
        {tab === "workweek" && <WorkweekPanel />}
      </div>
    </section>
  );
}
