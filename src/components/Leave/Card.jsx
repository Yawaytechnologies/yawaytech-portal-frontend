import React from "react";

export default function Card({ title, right, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold tracking-tight text-white">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusChip({ status }) {
  const map = {
    draft: "bg-zinc-500/30 text-zinc-200",
    submitted: "bg-sky-500/20 text-sky-300",
    approved: "bg-emerald-500/20 text-emerald-300",
    hr_approved: "bg-emerald-500/20 text-emerald-300",
    rejected: "bg-rose-500/20 text-rose-300",
    cancelled: "bg-orange-500/20 text-orange-300",
    changes_requested: "bg-amber-500/20 text-amber-300",
    published: "bg-emerald-500/20 text-emerald-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs border border-white/10 ${map[status] || "bg-white/10"}`}>
      {status}
    </span>
  );
}
