// src/components/EmployeeSide/Payslip.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaDownload, FaEye } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
// import { motion } from "framer-motion";

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

  useEffect(() => {
    if (!open) return;

    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = old;
    };
  }, [open]);

  useEffect(() => {
    const afterPrint = () => setPrintMode(false);
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  const handleView = (s) => {
    setActiveSlip(s);
    setOpen(true);
  };

  const handleDownload = (s) => {
    setActiveSlip(s);
    setOpen(false);
    setPrintMode(true);
    setTimeout(() => window.print(), 150);
  };

  const closeModal = () => setOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="no-print">
        <EmployeeSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          brandTitle="Yaway Tech Portal"
        />
      </div>

      <div className="md:pl-72">
        <div className="no-print">
          <EmployeeHeader
            onOpenSidebar={() => setSidebarOpen(true)}
            onLogout={() => {}}
            userId={userId}
          />
        </div>

        <div className="px-4 md:px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[1.15rem] font-extrabold tracking-tight text-slate-900 md:text-[1.3rem]">
                Payslip
              </div>
              <div className="mt-0.5 text-sm text-slate-500">
                View details and download
              </div>
            </div>

            <div className="no-print flex items-center gap-2">
              <label className="text-sm text-slate-600">Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 no-print">
            {slips.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
                <div className="font-semibold text-slate-900">
                  No payslip found
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Select another month to view dummy payslip data.
                </div>
                <div className="mt-3 text-xs text-slate-400">
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
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5 md:py-5">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">
                          {s.month}
                        </div>
                        <div className="mt-0.5 text-sm text-slate-500">
                          Gross:{" "}
                          <span className="font-medium text-slate-800">
                            {formatINR(t.gross)}
                          </span>{" "}
                          • Deductions:{" "}
                          <span className="font-medium text-slate-800">
                            {formatINR(t.ded)}
                          </span>{" "}
                          • Net:{" "}
                          <span className="font-semibold text-slate-900">
                            {formatINR(t.net)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Pay Date: {fmtDate(s.payDate)} • Mode:{" "}
                          {safeStr(s.payMode)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(s)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 transition hover:bg-slate-50 !text-slate-900"
                        >
                          <FaEye className="text-slate-900" />
                          <span className="text-[13px] font-semibold !text-slate-900">
                            View
                          </span>
                        </button>

                        <button
                          onClick={() => handleDownload(s)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-white shadow-md transition hover:from-indigo-700 hover:to-blue-700"
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

          {open && activeSlip
            ? createPortal(
                <div
                  className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-3 no-print"
                  onClick={closeModal}
                >
                  <div
                    className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                      <div className="font-extrabold text-slate-900">
                        Payslip
                      </div>

                      <button
                        onClick={closeModal}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 transition hover:bg-slate-50 !text-slate-900"
                        aria-label="Close"
                      >
                        <IoClose className="text-slate-900" size={18} />
                        <span className="text-[13px] font-semibold !text-slate-900">
                          Close
                        </span>
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500">Month</div>
                          <div className="font-semibold text-slate-900">
                            {activeSlip.month}
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500">
                            Paid Days
                          </div>
                          <div className="font-semibold text-slate-900">
                            {activeSlip.paidDays}
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500">
                            LOP Days
                          </div>
                          <div className="font-semibold text-slate-900">
                            {activeSlip.lopDays}
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500">
                            Net Pay
                          </div>
                          <div className="font-extrabold text-slate-900">
                            {formatINR(totals(activeSlip).net)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                        <div className="mb-3 font-semibold text-slate-900">
                          Employee, Bank & Statutory Details
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              Employee
                            </div>
                            <div className="font-semibold text-slate-900">
                              {emp.name}
                            </div>
                            <div className="mt-1 text-slate-600">
                              ID: {emp.employeeId}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              Department
                            </div>
                            <div className="font-semibold text-slate-900">
                              {emp.department}
                            </div>
                            <div className="mt-1 text-slate-600">
                              Designation: {emp.designation}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              Joining Date
                            </div>
                            <div className="font-semibold text-slate-900">
                              {emp.doj}
                            </div>
                            <div className="mt-1 text-slate-600">
                              PAN: {emp.pan}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              PF No
                            </div>
                            <div className="font-semibold text-slate-900">
                              {emp.pf}
                            </div>
                            <div className="mt-1 text-slate-600">
                              UAN: {emp.uan}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              ESI No
                            </div>
                            <div className="font-semibold text-slate-900">
                              {emp.esi}
                            </div>
                            <div className="mt-1 text-slate-600">
                              Email: {emp.email}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-3">
                            <div className="text-[11px] text-slate-500">
                              Mobile
                            </div>
                            <div className="font-semibold text-slate-900">
                              {emp.phone}
                            </div>
                            <div className="mt-1 text-slate-600">
                              IFSC: {emp.ifsc}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                          <div className="rounded-xl border border-slate-200 p-3 md:col-span-1">
                            <div className="text-[11px] text-slate-500">Bank</div>
                            <div className="font-semibold text-slate-900">
                              {emp.bankName}
                            </div>
                            <div className="mt-1 text-slate-600">
                              Branch: {emp.branch}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-3 md:col-span-2">
                            <div className="text-[11px] text-slate-500">
                              Account No
                            </div>
                            <div className="font-semibold text-slate-900">
                              {emp.bankAcc}
                            </div>
                            <div className="mt-1 text-slate-600">
                              IFSC: {emp.ifsc}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <div className="font-semibold text-slate-900">
                            Earnings
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            {Object.entries(activeSlip.earnings || {}).map(
                              ([k, v]) => (
                                <div key={k} className="flex justify-between">
                                  <span className="capitalize text-slate-600">
                                    {k.replaceAll("_", " ")}
                                  </span>
                                  <span className="font-medium text-slate-900">
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
                                  <span className="uppercase text-slate-600">
                                    {k}
                                  </span>
                                  <span className="font-medium text-slate-900">
                                    {formatINR(v)}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        {(() => {
                          const t = totals(activeSlip);

                          return (
                            <>
                              <div className="text-sm text-slate-700">
                                Net Pay
                                <div className="text-lg font-extrabold text-slate-900">
                                  {formatINR(t.net)}
                                </div>
                              </div>

                              <button
                                onClick={() => handleDownload(activeSlip)}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-white shadow-md transition hover:from-indigo-700 hover:to-blue-700"
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

          {printMode && activeSlip ? (
            <div className="print-only hidden">
              <div className="w-full">
                <div className="text-2xl font-extrabold text-slate-900">
                  Payslip
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Yaway Tech Portal • Month: {activeSlip.month}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Employee Name</div>
                    <div className="font-semibold text-slate-900">
                      {emp.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Employee ID: {emp.employeeId}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">
                      Department / Designation
                    </div>
                    <div className="font-semibold text-slate-900">
                      {emp.department}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      {emp.designation}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Joining Date</div>
                    <div className="font-semibold text-slate-900">
                      {emp.doj}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      PAN: {emp.pan}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Pay Details</div>
                    <div className="font-semibold text-slate-900">
                      Pay Date: {fmtDate(activeSlip.payDate)}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Mode: {safeStr(activeSlip.payMode)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 font-semibold text-slate-900">
                    Bank & Statutory
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">PF / UAN</div>
                      <div className="font-semibold text-slate-900">
                        {emp.pf}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        UAN: {emp.uan}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">ESI</div>
                      <div className="font-semibold text-slate-900">
                        {emp.esi}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Email: {emp.email}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">Bank</div>
                      <div className="font-semibold text-slate-900">
                        {emp.bankName}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Branch: {emp.branch}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">
                        Account / IFSC
                      </div>
                      <div className="font-semibold text-slate-900">
                        {emp.bankAcc}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
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
                            <span className="capitalize text-slate-600">
                              {k.replaceAll("_", " ")}
                            </span>
                            <span className="font-medium text-slate-900">
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
                            <span className="uppercase text-slate-600">{k}</span>
                            <span className="font-medium text-slate-900">
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
                        <div className="font-bold text-slate-900">
                          {formatINR(t.gross)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-3">
                        <div className="text-xs text-slate-500">
                          Total Deductions
                        </div>
                        <div className="font-bold text-slate-900">
                          {formatINR(t.ded)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-3">
                        <div className="text-xs text-slate-500">Net Pay</div>
                        <div className="font-extrabold text-slate-900">
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