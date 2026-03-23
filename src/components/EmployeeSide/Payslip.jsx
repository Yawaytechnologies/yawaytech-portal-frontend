// src/components/EmployeeSide/Payslip.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPortal } from "react-dom";
import { FaDownload, FaEye } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

import { fetchEmployeePayrollDetailThunk } from "../../redux/actions/payrollGenerateActions";
import {
  selectPayrollDetailByKey,
  selectPayrollDetailLoadingById,
  selectPayrollDetailError,
} from "../../redux/reducer/payrollGenerateSlice";
import { selectEmployeeId } from "../../redux/reducer/authSlice";

/** ---------------- helpers ---------------- */
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

function getMonthStart(month) {
  return month ? `${month}-01` : "";
}

function getAllowances(detail) {
  const arr = detail?.breakdown?.allowances;
  if (Array.isArray(arr)) {
    const obj = {};
    arr.forEach((item, i) => {
      const label = item?.rule_name || item?.name || `Allowance ${i + 1}`;
      obj[label] = item?.amount ?? 0;
    });
    return obj;
  }
  return detail?.allowances ?? {};
}

function getDeductions(detail) {
  const arr = detail?.breakdown?.deductions;
  if (Array.isArray(arr)) {
    const obj = {};
    arr.forEach((item, i) => {
      const label = item?.rule_name || item?.name || `Deduction ${i + 1}`;
      obj[label] = item?.amount ?? 0;
    });
    return obj;
  }
  return detail?.deductions ?? {};
}

function calcTotals(earnings, deductions) {
  const gross = Object.values(earnings || {}).reduce(
    (a, b) => a + Number(b || 0),
    0,
  );
  const ded = Object.values(deductions || {}).reduce(
    (a, b) => a + Number(b || 0),
    0,
  );
  return { gross, ded, net: gross - ded };
}

/** ---------------- component ---------------- */
export default function Payslip() {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  const [month, setMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${mm}`;
  });

  const employeeId = useSelector(selectEmployeeId);
  const monthStart = getMonthStart(month);

  const detail = useSelector((state) =>
    selectPayrollDetailByKey(state, String(employeeId), monthStart),
  );
  const loading = useSelector((state) =>
    selectPayrollDetailLoadingById(state, employeeId),
  );
  const error = useSelector(selectPayrollDetailError);

  useEffect(() => {
    if (!employeeId || !monthStart) return;
    dispatch(fetchEmployeePayrollDetailThunk({ employeeId, monthStart }));
  }, [dispatch, employeeId, monthStart]);

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

  const emp = useMemo(() => {
    if (!detail) return null;
    return {
      name: safeStr(
        detail.employee_name ??
          detail.employee?.name ??
          detail.employee?.full_name,
      ),
      employeeId: safeStr(
        detail.employee_code ?? detail.employee_id ?? detail.employee?.id,
      ),
      department: safeStr(
        detail.department ??
          detail.employee?.department ??
          detail.employee?.department_name,
      ),
      designation: safeStr(
        detail.designation ??
          detail.employee?.designation ??
          detail.employee_designation,
      ),
      doj: fmtDate(
        detail.date_of_joining ??
          detail.employee?.date_of_joining ??
          detail.joining_date,
      ),
      pan: safeStr(detail.pan_no ?? detail.employee?.pan_no),
      uan: safeStr(detail.uan_no ?? detail.employee?.uan_no),
      pf: safeStr(detail.pf_no ?? detail.employee?.pf_no),
      esi: safeStr(detail.esic_no ?? detail.employee?.esic_no),
      email: safeStr(detail.email ?? detail.employee?.email),
      phone: safeStr(
        detail.phone ?? detail.mobile ?? detail.employee?.mobile,
      ),
      bankName: safeStr(
        detail.bank_name ?? detail.employee?.bank_name,
      ),
      bankAcc: safeStr(
        detail.bank_account_no ?? detail.employee?.bank_account_no,
      ),
      ifsc: safeStr(detail.ifsc_code ?? detail.employee?.ifsc_code),
      branch: safeStr(
        detail.bank_branch ?? detail.employee?.bank_branch,
      ),
    };
  }, [detail]);

  const earnings = useMemo(() => getAllowances(detail), [detail]);
  const deductions = useMemo(() => getDeductions(detail), [detail]);
  const t = useMemo(() => calcTotals(earnings, deductions), [earnings, deductions]);

  const paidDays =
    detail?.present_days ?? detail?.attendance?.present_days ?? 0;
  const lopDays =
    detail?.absent_days ?? detail?.attendance?.absent_days ?? 0;
  const payDate = detail?.pay_date ?? detail?.payDate ?? "";
  const payMode = detail?.pay_mode ?? detail?.payMode ?? "Bank Transfer";

  const handleView = () => setOpen(true);
  const closeModal = () => setOpen(false);
  const handleDownload = () => {
    setOpen(false);
    setPrintMode(true);
    setTimeout(() => window.print(), 150);
  };

  return (
    <div>
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="mt-5 no-print">
            {/* Loading */}
            {loading && (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
                <svg
                  className="h-5 w-5 animate-spin text-indigo-500"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span className="text-sm">Loading payslip…</span>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="font-semibold text-red-700">
                  Failed to load payslip
                </div>
                <div className="mt-1 text-sm text-red-500">{error}</div>
                <button
                  onClick={() =>
                    dispatch(
                      fetchEmployeePayrollDetailThunk({
                        employeeId,
                        monthStart,
                      }),
                    )
                  }
                  className="mt-3 text-sm font-semibold text-indigo-600 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* No data */}
            {!loading && !error && !detail && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
                <div className="font-semibold text-slate-900">
                  No payslip found
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  No payslip data available for {month}.
                </div>
              </div>
            )}

            {/* Payslip card */}
            {!loading && !error && detail && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5 md:py-5">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{month}</div>
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
                    {payDate && (
                      <div className="mt-1 text-xs text-slate-400">
                        Pay Date: {fmtDate(payDate)} • Mode: {safeStr(payMode)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleView}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 transition hover:bg-slate-50 !text-slate-900"
                    >
                      <FaEye className="text-slate-900" />
                      <span className="text-[13px] font-semibold !text-slate-900">
                        View
                      </span>
                    </button>

                    <button
                      onClick={handleDownload}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-white shadow-md transition hover:from-indigo-700 hover:to-blue-700"
                    >
                      <FaDownload />
                      <span className="text-sm font-medium">Download</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal */}
          {open && detail && emp
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
                            {month}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500">
                            Paid Days
                          </div>
                          <div className="font-semibold text-slate-900">
                            {paidDays}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500">
                            LOP Days
                          </div>
                          <div className="font-semibold text-slate-900">
                            {lopDays}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500">
                            Net Pay
                          </div>
                          <div className="font-extrabold text-slate-900">
                            {formatINR(t.net)}
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
                            <div className="text-[11px] text-slate-500">
                              Bank
                            </div>
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
                            {Object.entries(earnings).map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="capitalize text-slate-600">
                                  {k.replaceAll("_", " ")}
                                </span>
                                <span className="font-medium text-slate-900">
                                  {formatINR(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-4">
                          <div className="font-semibold text-slate-900">
                            Deductions
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            {Object.entries(deductions).map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="uppercase text-slate-600">
                                  {k}
                                </span>
                                <span className="font-medium text-slate-900">
                                  {formatINR(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        <div className="text-sm text-slate-700">
                          Net Pay
                          <div className="text-lg font-extrabold text-slate-900">
                            {formatINR(t.net)}
                          </div>
                        </div>
                        <button
                          onClick={handleDownload}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-white shadow-md transition hover:from-indigo-700 hover:to-blue-700"
                        >
                          <FaDownload />
                          <span className="text-sm font-medium">Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body,
              )
            : null}

          {/* Print layout */}
          {printMode && detail && emp ? (
            <div className="print-only hidden">
              <div className="w-full">
                <div className="text-2xl font-extrabold text-slate-900">
                  Payslip
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Yaway Tech Portal • Month: {month}
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
                      {payDate ? `Pay Date: ${fmtDate(payDate)}` : month}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Mode: {safeStr(payMode)}
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
                      {Object.entries(earnings).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="capitalize text-slate-600">
                            {k.replaceAll("_", " ")}
                          </span>
                          <span className="font-medium text-slate-900">
                            {formatINR(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="font-semibold text-slate-900">
                      Deductions
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      {Object.entries(deductions).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="uppercase text-slate-600">{k}</span>
                          <span className="font-medium text-slate-900">
                            {formatINR(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

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

                <div className="mt-6 text-xs text-slate-500">
                  This is a system-generated payslip.
                </div>
              </div>
            </div>
          ) : null}
    </div>
  );
}
