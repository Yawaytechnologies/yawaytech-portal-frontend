// src/components/EmployeeSide/Payslip.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaDownload, FaEye } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { motion } from "framer-motion";

import EmployeeHeader from "./Header";
import EmployeeSidebar from "./Sidebar";

/** ---------------- helpers ---------------- */
function readAuth() {
  try {
    const token = localStorage.getItem("auth.token") || "";
    const userRaw = localStorage.getItem("auth.user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    return { token, user };
  } catch {
    return { token: "", user: null };
  }
}

function formatINR(v) {
  const n = Number(v || 0);
  try {
    return n.toLocaleString("en-IN", { style: "currency", currency: "INR" });
  } catch {
    return `₹${n}`;
  }
}

// ✅ no "-" fallback
function safeStr(v) {
  if (v == null) return "";
  const s = String(v).trim();
  return s ? s : "";
}

function fmtDate(v) {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}-${mm}-${yy}`;
  } catch {
    return String(v);
  }
}

// ✅ merge: auth overrides dummy ONLY if non-empty
function mergeNonEmpty(dummy, auth) {
  if (!auth) return { ...dummy };
  const out = { ...dummy, ...auth };
  for (const k of Object.keys(dummy)) {
    const av = auth?.[k];
    const ok =
      av !== null &&
      av !== undefined &&
      !(typeof av === "string" && av.trim() === "");
    if (!ok) out[k] = dummy[k];
  }
  return out;
}

/** ---------------- dummy data ---------------- */
const DUMMY_EMPLOYEE = {
  employee_code: "YTPL503IT",
  name: "Sowjanya S",
  department_name: "IT",
  role_name: "Software Developer",
  email: "sowjanya@yawaytech.com",
  mobile: "7806843931",
  date_of_joining: "2025-02-10",
  pan_no: "ABCDE1234F",
  uan_no: "101234567890",
  pf_no: "TN/CHN/1234567/000/0001234",
  esi_no: "55001234567890123",
  bank_name: "HDFC Bank",
  account_no: "123456789012",
  ifsc_code: "HDFC0001234",
  bank_branch: "Chennai - Main",
};

const DUMMY_SLIPS = [
  {
    id: "2026-02-001",
    month: "2026-02",
    paidDays: 26,
    lopDays: 0,
    payDate: "2026-02-28",
    payMode: "Bank Transfer",
    earnings: { basic: 18000, hra: 8000, allowance: 2000 },
    deductions: { pf: 1800, esi: 0, tds: 0 },
  },
  {
    id: "2026-01-001",
    month: "2026-01",
    paidDays: 25,
    lopDays: 1,
    payDate: "2026-01-31",
    payMode: "Bank Transfer",
    earnings: { basic: 18000, hra: 8000, allowance: 1500 },
    deductions: { pf: 1800, esi: 0, tds: 0 },
  },
  {
    id: "2025-12-001",
    month: "2025-12",
    paidDays: 26,
    lopDays: 0,
    payDate: "2025-12-31",
    payMode: "Bank Transfer",
    earnings: { basic: 17500, hra: 7800, allowance: 2000 },
    deductions: { pf: 1750, esi: 0, tds: 0 },
  },
];

/** ---------------- component ---------------- */
export default function Payslip() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [month, setMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${mm}`;
  });

  const [open, setOpen] = useState(false);
  const [activeSlip, setActiveSlip] = useState(null);

  // ✅ print mode ensures we print ONLY the full template
  const [printMode, setPrintMode] = useState(false);

  const { user: authUser } = useMemo(() => readAuth(), []);
  const user = useMemo(
    () => mergeNonEmpty(DUMMY_EMPLOYEE, authUser),
    [authUser],
  );

  const userId = useMemo(() => {
    return (
      user?.employee_code ||
      user?.emp_code ||
      user?.userId ||
      user?.id ||
      DUMMY_EMPLOYEE.employee_code
    );
  }, [user]);

  // Employee + bank + statutory details
  const emp = useMemo(() => {
    const fullName =
      user?.name ||
      user?.full_name ||
      user?.employee_name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
      "";

    return {
      name: safeStr(fullName),
      employeeId: safeStr(userId),
      department: safeStr(user?.department || user?.department_name),
      designation: safeStr(user?.designation || user?.role_name),
      email: safeStr(user?.email),
      phone: safeStr(user?.phone || user?.mobile),

      doj: fmtDate(user?.doj || user?.date_of_joining || user?.joining_date),

      pan: safeStr(user?.pan || user?.pan_no || user?.pan_number),
      uan: safeStr(user?.uan || user?.uan_no || user?.uan_number),
      pf: safeStr(user?.pf || user?.pf_no || user?.pf_number),
      esi: safeStr(user?.esi || user?.esi_no || user?.esi_number),

      bankName: safeStr(user?.bank_name || user?.bankName),
      bankAcc: safeStr(
        user?.bank_account || user?.account_no || user?.accountNumber,
      ),
      ifsc: safeStr(user?.ifsc || user?.ifsc_code),
      branch: safeStr(user?.bank_branch || user?.branch),
    };
  }, [user, userId]);

  // dummy slips filtered by selected month
  const slips = useMemo(
    () => DUMMY_SLIPS.filter((s) => s.month === month),
    [month],
  );

  const totals = (s) => {
    const gross =
      Object.values(s.earnings || {}).reduce((a, b) => a + Number(b || 0), 0) ||
      0;
    const ded =
      Object.values(s.deductions || {}).reduce(
        (a, b) => a + Number(b || 0),
        0,
      ) || 0;
    return { gross, ded, net: gross - ded };
  };

  // lock background scroll when modal open
  useEffect(() => {
    if (!open) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, [open]);

  // reset print mode after printing
  useEffect(() => {
    const afterPrint = () => setPrintMode(false);
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  const handleView = (s) => {
    setActiveSlip(s);
    setOpen(true);
  };

  // ✅ Download prints FULL DETAILS TEMPLATE (not modal)
  const handleDownload = (s) => {
    setActiveSlip(s);
    setOpen(false);
    setPrintMode(true);
    setTimeout(() => window.print(), 150);
  };

  const closeModal = () => setOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ✅ Print CSS: only print the full template */}
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Sidebar */}
      <div className="no-print">
        <EmployeeSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          brandTitle="Yaway Tech Portal"
        />
      </div>

      <div className="md:pl-72">
        {/* Header */}
        <div className="no-print">
          <EmployeeHeader
            onOpenSidebar={() => setSidebarOpen(true)}
            onLogout={() => {}}
            userId={userId}
          />
        </div>

        {/* Page content */}
        <div className="px-4 md:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <div className="text-slate-900 font-extrabold tracking-tight text-[1.15rem] md:text-[1.3rem]">
                Payslip
              </div>
              <div className="text-slate-500 text-sm mt-0.5">
                View details and download
              </div>
            </div>

            <div className="no-print flex items-center gap-2">
              <label className="text-sm text-slate-600">Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-200 text-slate-900"
              />
            </div>
          </div>

          {/* List */}
          <div className="mt-5 grid gap-4 no-print">
            {slips.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
                <div className="font-semibold text-slate-900">
                  No payslip found
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  Select another month to view dummy payslip data.
                </div>
                <div className="text-xs text-slate-400 mt-3">
                  Available dummy months:{" "}
                  {DUMMY_SLIPS.map((x) => x.month).join(", ")}
                </div>
              </div>
            ) : (
              slips.map((s) => {
                const t = totals(s);
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-4 md:px-5 md:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-slate-900 font-semibold">
                          {s.month}
                        </div>
                        <div className="text-slate-500 text-sm mt-0.5">
                          Gross:{" "}
                          <span className="text-slate-800 font-medium">
                            {formatINR(t.gross)}
                          </span>{" "}
                          • Deductions:{" "}
                          <span className="text-slate-800 font-medium">
                            {formatINR(t.ded)}
                          </span>{" "}
                          • Net:{" "}
                          <span className="text-slate-900 font-semibold">
                            {formatINR(t.net)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Pay Date: {fmtDate(s.payDate)} • Mode:{" "}
                          {safeStr(s.payMode)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(s)}
                          className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition inline-flex items-center gap-2 !text-slate-900"
                        >
                          <FaEye className="text-slate-900" />
                          <span className="text-[13px] font-semibold !text-slate-900">
                            View
                          </span>
                        </button>

                        <button
                          onClick={() => handleDownload(s)}
                          className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 transition shadow-md inline-flex items-center gap-2"
                        >
                          <FaDownload />
                          <span className="text-sm font-medium">Download</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Modal (view only) */}
          {open && activeSlip
            ? createPortal(
                <div
                  className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-3 no-print"
                  onClick={closeModal}
                >
                  <div
                    className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                  >
                    <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="font-extrabold text-slate-900">
                        Payslip
                      </div>

                      <button
                        onClick={closeModal}
                        className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition inline-flex items-center gap-2 !text-slate-900"
                        aria-label="Close"
                      >
                        <IoClose className="text-slate-900" size={18} />
                        <span className="text-[13px] font-semibold !text-slate-900">
                          Close
                        </span>
                      </button>
                    </div>

                    <div className="p-5">
                      {/* same details as print (short here) */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500">
                            Month
                          </div>
                          <div className="text-slate-900 font-semibold">
                            {activeSlip.month}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500">
                            Paid Days
                          </div>
                          <div className="text-slate-900 font-semibold">
                            {activeSlip.paidDays}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500">
                            LOP Days
                          </div>
                          <div className="text-slate-900 font-semibold">
                            {activeSlip.lopDays}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500">
                            Net Pay
                          </div>
                          <div className="text-slate-900 font-extrabold">
                            {formatINR(totals(activeSlip).net)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                        <div className="text-slate-900 font-semibold mb-3">
                          Employee, Bank & Statutory Details
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              Employee
                            </div>
                            <div className="text-slate-900 font-semibold">
                              {emp.name}
                            </div>
                            <div className="text-slate-600 mt-1">
                              ID: {emp.employeeId}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              Department
                            </div>
                            <div className="text-slate-900 font-semibold">
                              {emp.department}
                            </div>
                            <div className="text-slate-600 mt-1">
                              Designation: {emp.designation}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              Joining Date
                            </div>
                            <div className="text-slate-900 font-semibold">
                              {emp.doj}
                            </div>
                            <div className="text-slate-600 mt-1">
                              PAN: {emp.pan}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              PF No
                            </div>
                            <div className="text-slate-900 font-semibold">
                              {emp.pf}
                            </div>
                            <div className="text-slate-600 mt-1">
                              UAN: {emp.uan}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              ESI No
                            </div>
                            <div className="text-slate-900 font-semibold">
                              {emp.esi}
                            </div>
                            <div className="text-slate-600 mt-1">
                              Email: {emp.email}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              Mobile
                            </div>
                            <div className="text-slate-900 font-semibold">
                              {emp.phone}
                            </div>
                            <div className="text-slate-600 mt-1">
                              IFSC: {emp.ifsc}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="rounded-xl border border-slate-200 p-3 md:col-span-1">
                            <div className="text-[11px] text-slate-500">
                              Bank
                            </div>
                            <div className="text-slate-900 font-semibold">
                              {emp.bankName}
                            </div>
                            <div className="text-slate-600 mt-1">
                              Branch: {emp.branch}
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-200 p-3 md:col-span-2">
                            <div className="text-[11px] text-slate-500">
                              Account No
                            </div>
                            <div className="text-slate-900 font-semibold">
                              {emp.bankAcc}
                            </div>
                            <div className="text-slate-600 mt-1">
                              IFSC: {emp.ifsc}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <div className="font-semibold text-slate-900">
                            Earnings
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            {Object.entries(activeSlip.earnings || {}).map(
                              ([k, v]) => (
                                <div key={k} className="flex justify-between">
                                  <span className="text-slate-600 capitalize">
                                    {k.replaceAll("_", " ")}
                                  </span>
                                  <span className="text-slate-900 font-medium">
                                    {formatINR(v)}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-4">
                          <div className="font-semibold text-slate-900">
                            Deductions
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            {Object.entries(activeSlip.deductions || {}).map(
                              ([k, v]) => (
                                <div key={k} className="flex justify-between">
                                  <span className="text-slate-600 uppercase">
                                    {k}
                                  </span>
                                  <span className="text-slate-900 font-medium">
                                    {formatINR(v)}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                        {(() => {
                          const t = totals(activeSlip);
                          return (
                            <>
                              <div className="text-slate-700 text-sm">
                                Net Pay
                                <div className="text-slate-900 font-extrabold text-lg">
                                  {formatINR(t.net)}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownload(activeSlip)}
                                className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 transition shadow-md inline-flex items-center gap-2"
                              >
                                <FaDownload />
                                <span className="text-sm font-medium">
                                  Download
                                </span>
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>,
                document.body,
              )
            : null}

          {/* ✅ FULL DETAILS PRINT TEMPLATE (this is what "Download" prints) */}
          {printMode && activeSlip ? (
            <div className="print-only hidden">
              <div className="w-full">
                <div className="text-2xl font-extrabold text-slate-900">
                  Payslip
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Yaway Tech Portal • Month: {activeSlip.month}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Employee Name</div>
                    <div className="text-slate-900 font-semibold">
                      {emp.name}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Employee ID: {emp.employeeId}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">
                      Department / Designation
                    </div>
                    <div className="text-slate-900 font-semibold">
                      {emp.department}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {emp.designation}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Joining Date</div>
                    <div className="text-slate-900 font-semibold">
                      {emp.doj}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      PAN: {emp.pan}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Pay Details</div>
                    <div className="text-slate-900 font-semibold">
                      Pay Date: {fmtDate(activeSlip.payDate)}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Mode: {safeStr(activeSlip.payMode)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <div className="text-slate-900 font-semibold mb-2">
                    Bank & Statutory
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">PF / UAN</div>
                      <div className="text-slate-900 font-semibold">
                        {emp.pf}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        UAN: {emp.uan}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">ESI</div>
                      <div className="text-slate-900 font-semibold">
                        {emp.esi}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Email: {emp.email}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">Bank</div>
                      <div className="text-slate-900 font-semibold">
                        {emp.bankName}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Branch: {emp.branch}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">
                        Account / IFSC
                      </div>
                      <div className="text-slate-900 font-semibold">
                        {emp.bankAcc}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        IFSC: {emp.ifsc}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="font-semibold text-slate-900">Earnings</div>
                    <div className="mt-3 space-y-2 text-sm">
                      {Object.entries(activeSlip.earnings || {}).map(
                        ([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-slate-600 capitalize">
                              {k.replaceAll("_", " ")}
                            </span>
                            <span className="text-slate-900 font-medium">
                              {formatINR(v)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="font-semibold text-slate-900">
                      Deductions
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      {Object.entries(activeSlip.deductions || {}).map(
                        ([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-slate-600 uppercase">
                              {k}
                            </span>
                            <span className="text-slate-900 font-medium">
                              {formatINR(v)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {(() => {
                  const t = totals(activeSlip);
                  return (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-slate-200 p-3">
                        <div className="text-xs text-slate-500">Gross</div>
                        <div className="text-slate-900 font-bold">
                          {formatINR(t.gross)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3">
                        <div className="text-xs text-slate-500">
                          Total Deductions
                        </div>
                        <div className="text-slate-900 font-bold">
                          {formatINR(t.ded)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3">
                        <div className="text-xs text-slate-500">Net Pay</div>
                        <div className="text-slate-900 font-extrabold">
                          {formatINR(t.net)}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-6 text-xs text-slate-500">
                  This is a system-generated payslip.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
