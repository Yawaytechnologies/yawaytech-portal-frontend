import React from "react";
import cx from "./cx";

export default function Chip({ tone = "slate", children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
        tone === "green" && "bg-green-100 text-green-700",
        tone === "red" && "bg-red-100 text-red-700",
        tone === "amber" && "bg-amber-100 text-amber-700",
        tone === "blue" && "bg-blue-100 text-blue-700",
        tone === "slate" && "bg-slate-100 text-slate-700"
      )}
    >
      {children}
    </span>
  );
}
