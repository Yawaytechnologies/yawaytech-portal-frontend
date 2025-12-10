import React, { useState } from "react";
import { RequestsPanel, PoliciesPanel, HolidaysPanel, WorkweekPanel } from "../components/leave-admin";

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
    <section className="p-6 md:p-10 text-slate-900">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Leave Management — Admin</h1>
         
        </div>

        {/* tabs */}
        <nav
          className="rounded-xl bg-slate-100 p-1 flex shadow-inner"
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
                  "px-3 py-1.5 rounded-lg text-sm font-medium outline-none",
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

      <div className="grid gap-8">
        {tab === "requests" && <RequestsPanel />}
        {tab === "policies" && <PoliciesPanel />}
        {tab === "holidays" && <HolidaysPanel />}
        {tab === "workweek" && <WorkweekPanel />}
      </div>
    </section>
  );
}
