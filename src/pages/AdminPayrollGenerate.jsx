import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaEye, FaDownload } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { IoCloseSharp } from "react-icons/io5";

import {
  fetchPayrollListThunk,
  fetchEmployeePayrollDetailThunk,
} from "../redux/actions/payrollGenerateActions";
import {
  selectPayrollRows,
  selectPayrollListLoading,
  selectPayrollListError,
  selectPayrollDetailError,
  selectPayrollDetailByKey,
} from "../redux/reducer/payrollGenerateSlice";

const DEFAULT_MONTH = new Date().toISOString().slice(0, 7);

function getMonthStart(monthValue) {
  return monthValue ? `${monthValue}-01` : "";
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(value) {
  return `₹${toNumber(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatHours(value) {
  const n = toNumber(value);
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function getEmployeeId(row) {
  return (
    row?.employee_id ??
    row?.employee?.employee_id ??
    row?.employee?.id ??
    row?.id ??
    "-"
  );
}

function getEmployeeName(row) {
  return (
    row?.employee_code ??
    row?.employee_name ??
    row?.employee?.name ??
    row?.employee?.full_name ??
    row?.name ??
    "-"
  );
}

function getDepartment(row) {
  return (
    row?.department ??
    row?.employee?.department ??
    row?.employee?.department_name ??
    "-"
  );
}

function getDesignation(row) {
  return (
    row?.designation ??
    row?.employee?.designation ??
    row?.employee_designation ??
    "-"
  );
}

function getJoiningDate(row) {
  return (
    row?.date_of_joining ??
    row?.employee?.date_of_joining ??
    row?.joining_date ??
    "-"
  );
}

function getPfNo(row) {
  return row?.pf_no ?? row?.employee?.pf_no ?? "-";
}

function getEsicNo(row) {
  return row?.esic_no ?? row?.employee?.esic_no ?? "-";
}

function getBankAccountNo(row) {
  return (
    row?.bank_account_no ??
    row?.employee?.bank_account_no ??
    row?.bank?.account_number ??
    "-"
  );
}

function getBankName(row) {
  return row?.bank_name ?? row?.employee?.bank_name ?? row?.bank?.name ?? "-";
}

function getBase(row) {
  return (
    row?.salary?.base ??
    row?.base_salary ??
    row?.salary_breakdown?.base_salary ??
    row?.summary?.base_salary ??
    0
  );
}

function getGross(row) {
  return (
    row?.salary?.gross ??
    row?.gross_salary ??
    row?.gross ??
    row?.salary_breakdown?.gross_salary ??
    row?.summary?.gross_salary ??
    0
  );
}

function getNet(row) {
  return (
    row?.salary?.net ??
    row?.net_salary ??
    row?.net ??
    row?.salary_breakdown?.net_salary ??
    row?.summary?.net_salary ??
    0
  );
}

function getPresentDays(row) {
  return (
    row?.present_days ??
    row?.attendance?.present_days ??
    row?.attendance_summary?.present_days ??
    0
  );
}

function getWeeklyOffDays(row) {
  return row?.weekly_off_days ?? row?.attendance?.weekly_off_days ?? 0;
}

function getAbsentDays(row) {
  return row?.absent_days ?? row?.attendance?.absent_days ?? 0;
}

function getTotalWorkDays(row) {
  return (
    row?.attendance?.total_work_days ??
    row?.attendance_summary?.total_work_days ??
    0
  );
}

function getWorkedHours(row) {
  return (
    row?.attendance?.worked_hours ?? row?.attendance_summary?.worked_hours ?? 0
  );
}

function getExpectedHours(row) {
  return (
    row?.attendance?.expected_hours ??
    row?.attendance_summary?.expected_hours ??
    0
  );
}

function getOvertime(row) {
  return (
    row?.overtime_hours ??
    row?.attendance?.overtime_hours ??
    row?.attendance_summary?.overtime_hours ??
    0
  );
}

function getAllowances(detail) {
  const arr = detail?.breakdown?.allowances;
  if (Array.isArray(arr)) {
    const obj = {};
    arr.forEach((item, index) => {
      const label =
        item?.rule_name ||
        item?.name ||
        item?.allowance_name ||
        `Allowance ${index + 1}`;
      obj[label] = item?.amount ?? 0;
    });
    return obj;
  }

  return (
    detail?.allowances ??
    detail?.breakdown?.allowances ??
    detail?.salary_breakdown?.allowances ??
    {}
  );
}

function getDeductions(detail) {
  const arr = detail?.breakdown?.deductions;
  if (Array.isArray(arr)) {
    const obj = {};
    arr.forEach((item, index) => {
      const label =
        item?.rule_name ||
        item?.name ||
        item?.deduction_name ||
        `Deduction ${index + 1}`;
      obj[label] = item?.amount ?? 0;
    });
    return obj;
  }

  return (
    detail?.deductions ??
    detail?.breakdown?.deductions ??
    detail?.salary_breakdown?.deductions ??
    {}
  );
}

function normalizeEntries(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  return Object.entries(obj);
}

function formatLabel(key) {
  return String(key || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMonthTitle(monthStart) {
  if (!monthStart) return "-";
  const date = new Date(monthStart);
  return date.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function safeAmount(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function buildEarningsRows(detail) {
  const salary = detail?.salary || {};
  const allowances = getAllowances(detail);

  const rows = [
    [
      "Basic Salary",
      formatCurrency(safeAmount(salary.base || getBase(detail))),
    ],
  ];

  Object.entries(allowances || {}).forEach(([key, value]) => {
    rows.push([formatLabel(key), formatCurrency(safeAmount(value))]);
  });

  return rows;
}

function buildDeductionRows(detail) {
  const deductions = getDeductions(detail);
  const rows = [];

  Object.entries(deductions || {}).forEach(([key, value]) => {
    rows.push([formatLabel(key), formatCurrency(safeAmount(value))]);
  });

  return rows.length ? rows : [["No Deductions", "-"]];
}

function downloadPayslipPdf(detail, monthStart) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  const employeeName = getEmployeeName(detail);
  const employeeId = getEmployeeId(detail);
  const designation = getDesignation(detail);
  const department = getDepartment(detail);
  const joiningDate = getJoiningDate(detail);
  const pfNo = getPfNo(detail);
  const esicNo = getEsicNo(detail);
  const bankAccountNo = getBankAccountNo(detail);
  const bankName = getBankName(detail);

  const presentDays = getPresentDays(detail);
  const weeklyOffDays = getWeeklyOffDays(detail);
  const absentDays = getAbsentDays(detail);

  const grossSalary = getGross(detail);
  const netSalary = getNet(detail);

  const earningsRows = buildEarningsRows(detail);
  const deductionRows = buildDeductionRows(detail);

  const earningsTotal = earningsRows.reduce((sum, row) => {
    const raw = String(row[1]).replace(/[₹,]/g, "");
    return sum + safeAmount(raw);
  }, 0);

  const deductionsTotal = deductionRows.reduce((sum, row) => {
    const raw = String(row[1]).replace(/[₹,]/g, "");
    return sum + safeAmount(raw);
  }, 0);

  doc.setDrawColor(40, 40, 40);
  doc.rect(5, 5, 200, 287);

  doc.setFillColor(24, 59, 109);
  doc.rect(5, 5, 200, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Yaway Technologies Pvt Ltd", pageWidth / 2, 14, {
    align: "center",
  });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text("Salary Slip", pageWidth / 2, 42, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    `for ${formatMonthTitle(monthStart).toUpperCase()}`,
    pageWidth / 2,
    49,
    {
      align: "center",
    },
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(employeeName, pageWidth / 2, 57, { align: "center" });

  doc.setTextColor(48, 78, 153);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("YAWAY", 12, 60);
  doc.setTextColor(0, 153, 204);
  doc.setFontSize(10);
  doc.text("TECHNOLOGIES", 12, 66);

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(120, 120, 120);
  doc.line(6, 72, 199, 72);

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");

  doc.text("Employee Code :", 6, 79);
  doc.text("Designation :", 6, 86);
  doc.text("Department :", 6, 93);
  doc.text("Date of Joining :", 6, 100);

  doc.setFont("helvetica", "normal");
  doc.text(String(employeeId), 42, 79);
  doc.text(String(designation), 42, 86);
  doc.text(String(department), 42, 93);
  doc.text(String(joiningDate), 42, 100);

  doc.setFont("helvetica", "bold");
  doc.text("PF Account No. :", 110, 79);
  doc.text("ESIC No. :", 110, 86);
  doc.text("Bank Account No. :", 110, 93);
  doc.text("Bank Name :", 110, 100);

  doc.setFont("helvetica", "normal");
  doc.text(String(pfNo), 165, 79);
  doc.text(String(esicNo), 165, 86);
  doc.text(String(bankAccountNo), 165, 93);
  doc.text(String(bankName), 165, 100);

  autoTable(doc, {
    startY: 108,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 1.5,
      lineColor: [90, 90, 90],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    head: [["Attendance Details", "Value"]],
    body: [
      ["Present Days", `${presentDays} Days`],
      ["Weekly Offs/Holidays", `${weeklyOffDays} Days`],
      ["Absent Days", `${absentDays} Days`],
    ],
    margin: { left: 6, right: 110 },
  });

  const attendanceY = doc.lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: attendanceY,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 1.4,
      lineColor: [90, 90, 90],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    head: [["Earnings", "Amount"]],
    body: [
      ...earningsRows,
      ["Gross Salary", formatCurrency(grossSalary)],
      ["Total Earnings", formatCurrency(earningsTotal)],
    ],
    margin: { left: 6, right: 110 },
  });

  autoTable(doc, {
    startY: attendanceY,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 1.4,
      lineColor: [90, 90, 90],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    head: [["Deductions", "Amount"]],
    body: [
      ...deductionRows,
      ["Total Deductions", formatCurrency(deductionsTotal)],
      ["Net Amount", formatCurrency(netSalary)],
    ],
    margin: { left: 105, right: 6 },
  });

  const finalY = Math.max(doc.lastAutoTable.finalY, attendanceY + 70);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("Amount (in words):", 6, finalY + 10);

  doc.setFont("helvetica", "normal");
  doc.text(formatCurrency(netSalary), 6, finalY + 17);

  doc.save(`Payslip-${employeeId}-${monthStart}.pdf`);
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-2 text-base font-bold sm:text-lg 2xl:text-xl">
        {value}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white sm:text-base">
        {value}
      </div>
    </div>
  );
}

function BreakdownCard({ title, entries, emptyText = "No data" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      <div className="border-b border-white/10 px-4 py-3 text-sm font-bold text-white/90">
        {title}
      </div>

      <div className="p-4">
        {entries.length === 0 ? (
          <div className="text-sm text-white/55">{emptyText}</div>
        ) : (
          <div className="space-y-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2"
              >
                <span className="text-sm text-white/75">
                  {formatLabel(key)}
                </span>
                <span className="text-sm font-semibold text-white">
                  {typeof value === "number"
                    ? formatCurrency(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPayrollGenerate() {
  const dispatch = useDispatch();

  const reduxRows = useSelector(selectPayrollRows);
  const loading = useSelector(selectPayrollListLoading);
  const listError = useSelector(selectPayrollListError);
  const detailError = useSelector(selectPayrollDetailError);
  const loadingDetailById = useSelector(
    (state) => state.payrollGenerate?.loadingDetailById || {},
  );

  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [query, setQuery] = useState("");
  const [pageRows, setPageRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [detailNotice, setDetailNotice] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const monthStart = getMonthStart(month);

  const rows = pageRows.length ? pageRows : reduxRows;

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;

    return rows.filter((row) => {
      const id = String(getEmployeeId(row)).toLowerCase();
      const name = String(getEmployeeName(row)).toLowerCase();
      const department = String(getDepartment(row)).toLowerCase();
      return (
        id.includes(search) ||
        name.includes(search) ||
        department.includes(search)
      );
    });
  }, [rows, query]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.gross += toNumber(getGross(row));
        acc.net += toNumber(getNet(row));
        return acc;
      },
      { gross: 0, net: 0 },
    );
  }, [filteredRows]);

  const selectedDetail = useSelector((state) =>
    selectedEmployeeId
      ? selectPayrollDetailByKey(state, selectedEmployeeId, monthStart)
      : null,
  );

  const selectedDetailLoading = selectedEmployeeId
    ? !!loadingDetailById[String(selectedEmployeeId)]
    : false;

  const modalData = selectedDetail || selectedRow;
  const allowanceEntries = normalizeEntries(getAllowances(modalData));
  const deductionEntries = normalizeEntries(getDeductions(modalData));

  const loadPayrollList = async () => {
    if (!monthStart) return;

    console.log("GENERATE CLICKED", monthStart);

    const result = await dispatch(fetchPayrollListThunk({ monthStart }));
    setHasLoadedOnce(true);

    if (fetchPayrollListThunk.fulfilled.match(result)) {
      const apiRows = result.payload?.data || [];
      console.log("PAYROLL FINAL ROWS:", apiRows);
      setPageRows(apiRows);
    } else {
      setPageRows([]);
      console.log("PAYROLL LIST FAILED:", result.payload);
    }
  };

  useEffect(() => {
    loadPayrollList();
  }, [monthStart]);

  const handleView = async (row) => {
    const employeeId = String(getEmployeeId(row));
    if (!employeeId || employeeId === "-") return;

    setSelectedRow(row);
    setSelectedEmployeeId(employeeId);
    setDetailNotice("");

    const result = await dispatch(
      fetchEmployeePayrollDetailThunk({ employeeId, monthStart }),
    );

    if (fetchEmployeePayrollDetailThunk.rejected.match(result)) {
      setDetailNotice(
        "Detailed employee API failed. Showing available summary data.",
      );
    }
  };

  const handleDownload = async (row) => {
    const employeeId = String(getEmployeeId(row));
    if (!employeeId || employeeId === "-") return;

    const result = await dispatch(
      fetchEmployeePayrollDetailThunk({ employeeId, monthStart }),
    );

    if (fetchEmployeePayrollDetailThunk.fulfilled.match(result)) {
      downloadPayslipPdf(result.payload.data, monthStart);
    } else {
      downloadPayslipPdf(row, monthStart);
    }
  };

  return (
    <>
      <div className="min-h-screen w-full px-2 py-2 text-white sm:px-3 sm:py-3 md:px-4 md:py-4 xl:px-5 2xl:px-6">
        <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1830] via-[#17264f] to-[#24386e] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="border-b border-white/10 px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-7 2xl:px-8">
            <div className="flex flex-col gap-4 2xl:gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold leading-none tracking-wide sm:text-3xl lg:text-4xl 2xl:text-5xl">
                  Payroll Generate
                </h1>
                <p className="mt-2 text-xs text-white/55 sm:text-sm lg:text-base 2xl:text-lg">
                  Load payroll list for a month, view employee details, and
                  download payroll data.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[220px_1fr_auto] xl:items-end 2xl:grid-cols-[260px_380px_auto]">
                <div className="min-w-0">
                  <label className="mb-2 block text-xs font-semibold text-white/65 sm:text-sm">
                    Month
                  </label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-[#FF5800]/50 sm:h-12 2xl:h-14 2xl:text-base"
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-xs font-semibold text-white/65 sm:text-sm">
                    Search
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search employee / department"
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none placeholder:text-white/35 focus:border-[#FF5800]/50 sm:h-12 2xl:h-14 2xl:text-base"
                  />
                </div>

                <div className="flex gap-2 sm:col-span-2 xl:col-span-1">
                  <button
                    type="button"
                    onClick={loadPayrollList}
                    disabled={loading}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#FF5800] px-4 text-sm font-extrabold hover:brightness-110 disabled:opacity-60 sm:h-12 xl:min-w-[140px] 2xl:h-14 2xl:min-w-[170px] 2xl:text-base"
                  >
                    {loading ? "Loading..." : "Generate"}
                  </button>

                  <button
                    type="button"
                    onClick={loadPayrollList}
                    disabled={loading}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 disabled:opacity-60 sm:h-12 sm:w-12 2xl:h-14 2xl:w-14"
                    title="Refresh"
                  >
                    <MdRefresh className="text-xl 2xl:text-2xl" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {(listError || detailError) && (
            <div className="border-b border-white/10 px-4 py-3 sm:px-5 md:px-6 lg:px-7 2xl:px-8">
              <div className="space-y-2">
                {listError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 2xl:text-base">
                    {listError}
                  </div>
                )}

                {detailError && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 2xl:text-base">
                    {detailError}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5 sm:py-5 xl:grid-cols-4 md:px-6 lg:px-7 2xl:px-8">
            <SummaryCard label="Month Start" value={monthStart || "-"} />
            <SummaryCard
              label="Employees"
              value={String(filteredRows.length)}
            />
            <SummaryCard
              label="Gross Total"
              value={formatCurrency(totals.gross)}
            />
            <SummaryCard label="Net Total" value={formatCurrency(totals.net)} />
          </div>

          <div className="px-4 pb-4 sm:px-5 md:px-6 lg:px-7 2xl:px-8 2xl:pb-8">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-4 py-3 sm:px-5 2xl:px-6">
                <h2 className="text-sm font-semibold text-white/80 sm:text-base 2xl:text-lg">
                  Employee Payroll List
                </h2>
              </div>

              {loading ? (
                <div className="px-4 py-10 text-sm text-white/60 sm:px-5 2xl:text-base">
                  Loading payroll data...
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="px-4 py-10 text-sm text-white/60 sm:px-5 2xl:text-base">
                  {hasLoadedOnce
                    ? "No payroll data found for this month."
                    : "Loading payroll data..."}
                </div>
              ) : (
                <>
                  <div className="block md:hidden">
                    <div className="space-y-3 p-3 sm:p-4">
                      {filteredRows.map((row, index) => {
                        const employeeId = String(getEmployeeId(row));
                        const isDetailLoading = !!loadingDetailById[employeeId];

                        return (
                          <div
                            key={`${employeeId}-${index}`}
                            className="rounded-2xl border border-white/10 bg-white/5 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-base font-bold text-white">
                                  {getEmployeeName(row)}
                                </h3>
                                <p className="mt-1 text-xs text-white/55">
                                  ID: {employeeId}
                                </p>
                                <p className="mt-1 text-xs text-white/55">
                                  Department: {getDepartment(row)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                              <div className="rounded-xl bg-white/5 px-3 py-2">
                                <p className="text-[11px] text-white/50">
                                  Gross
                                </p>
                                <p className="mt-1 font-semibold text-white/90">
                                  {formatCurrency(getGross(row))}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white/5 px-3 py-2">
                                <p className="text-[11px] text-white/50">Net</p>
                                <p className="mt-1 font-semibold text-white/90">
                                  {formatCurrency(getNet(row))}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white/5 px-3 py-2">
                                <p className="text-[11px] text-white/50">
                                  Present Days
                                </p>
                                <p className="mt-1 font-semibold text-white/90">
                                  {getPresentDays(row)}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white/5 px-3 py-2">
                                <p className="text-[11px] text-white/50">
                                  Overtime
                                </p>
                                <p className="mt-1 font-semibold text-white/90">
                                  {formatHours(getOvertime(row))}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => handleView(row)}
                                disabled={isDetailLoading}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500/15 px-4 text-sm font-bold text-blue-200 hover:bg-blue-500/25 disabled:opacity-60"
                              >
                                <FaEye className="text-sm" />
                                {isDetailLoading ? "Loading..." : "View"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownload(row)}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-4 text-sm font-bold text-emerald-200 hover:bg-emerald-500/25"
                              >
                                <FaDownload className="text-sm" />
                                Download
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-full text-sm 2xl:text-base">
                      <thead className="bg-white/5">
                        <tr className="text-left text-white/80">
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Employee ID
                          </th>
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Name
                          </th>
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Department
                          </th>
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Gross
                          </th>
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Net
                          </th>
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Present
                          </th>
                          <th className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Overtime
                          </th>
                          <th className="px-4 py-3 text-center font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredRows.map((row, index) => {
                          const employeeId = String(getEmployeeId(row));
                          const isDetailLoading =
                            !!loadingDetailById[employeeId];

                          return (
                            <tr
                              key={`${employeeId}-${index}`}
                              className="border-t border-white/10 text-white/85 transition-colors hover:bg-white/[0.04]"
                            >
                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                {employeeId}
                              </td>
                              <td className="px-4 py-3 font-semibold lg:px-5 2xl:px-6 2xl:py-4">
                                {getEmployeeName(row)}
                              </td>
                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                {getDepartment(row)}
                              </td>
                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                {formatCurrency(getGross(row))}
                              </td>
                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                {formatCurrency(getNet(row))}
                              </td>
                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                {getPresentDays(row)}
                              </td>
                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                {formatHours(getOvertime(row))}
                              </td>
                              <td className="px-4 py-3 lg:px-5 2xl:px-6 2xl:py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleView(row)}
                                    disabled={isDetailLoading}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-500/15 px-3 text-sm font-bold text-blue-200 hover:bg-blue-500/25 disabled:opacity-60"
                                  >
                                    <FaEye className="text-sm" />
                                    <span className="hidden xl:inline">
                                      View
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownload(row)}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-3 text-sm font-bold text-emerald-200 hover:bg-emerald-500/25"
                                  >
                                    <FaDownload className="text-sm" />
                                    <span className="hidden xl:inline">
                                      Download
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalData && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm px-0 py-0 sm:px-4 sm:py-4 md:px-6">
          <div className="mx-auto flex h-full w-full max-w-6xl items-end sm:items-center">
            <div className="flex h-full w-full flex-col overflow-hidden rounded-none border border-white/10 bg-[#0e1b34] text-white shadow-2xl sm:h-[92vh] sm:rounded-3xl">
              <div className="flex items-start justify-between border-b border-white/10 px-4 py-4 sm:px-5 md:px-6 2xl:px-7">
                <div className="min-w-0 pr-3">
                  <h2 className="text-lg font-extrabold sm:text-xl 2xl:text-2xl">
                    Employee Payroll Detail
                  </h2>
                  <p className="mt-1 text-xs text-white/55 sm:text-sm 2xl:text-base">
                    {getEmployeeName(modalData)} · {getEmployeeId(modalData)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRow(null);
                    setSelectedEmployeeId("");
                    setDetailNotice("");
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/15"
                >
                  <IoCloseSharp className="text-xl" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 md:px-6 2xl:px-7">
                {selectedDetailLoading && (
                  <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                    Loading employee details...
                  </div>
                )}

                {detailNotice && (
                  <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    {detailNotice}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <InfoCard
                    label="Employee ID"
                    value={String(getEmployeeId(modalData))}
                  />
                  <InfoCard
                    label="Employee Name"
                    value={getEmployeeName(modalData)}
                  />
                  <InfoCard
                    label="Department"
                    value={getDepartment(modalData)}
                  />
                  <InfoCard label="Month Start" value={monthStart} />

                  <InfoCard
                    label="Base Salary"
                    value={formatCurrency(getBase(modalData))}
                  />
                  <InfoCard
                    label="Gross Salary"
                    value={formatCurrency(getGross(modalData))}
                  />
                  <InfoCard
                    label="Net Salary"
                    value={formatCurrency(getNet(modalData))}
                  />
                  <InfoCard
                    label="Present Days"
                    value={String(getPresentDays(modalData))}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5">
                    <div className="border-b border-white/10 px-4 py-3 text-sm font-bold text-white/90">
                      Attendance Details
                    </div>

                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                        <div className="text-xs text-white/50">
                          Present Days
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white sm:text-base">
                          {getPresentDays(modalData)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                        <div className="text-xs text-white/50">
                          Total Work Days
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white sm:text-base">
                          {getTotalWorkDays(modalData)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                        <div className="text-xs text-white/50">
                          Worked Hours
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white sm:text-base">
                          {formatHours(getWorkedHours(modalData))}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                        <div className="text-xs text-white/50">
                          Expected Hours
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white sm:text-base">
                          {formatHours(getExpectedHours(modalData))}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/[0.04] px-4 py-3 sm:col-span-2">
                        <div className="text-xs text-white/50">
                          Overtime Hours
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white sm:text-base">
                          {formatHours(getOvertime(modalData))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5">
                    <div className="border-b border-white/10 px-4 py-3 text-sm font-bold text-white/90">
                      Salary Snapshot
                    </div>

                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                        <div className="text-xs text-white/50">Base</div>
                        <div className="mt-1 text-sm font-semibold text-white sm:text-base">
                          {formatCurrency(getBase(modalData))}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                        <div className="text-xs text-white/50">Gross</div>
                        <div className="mt-1 text-sm font-semibold text-white sm:text-base">
                          {formatCurrency(getGross(modalData))}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                        <div className="text-xs text-white/50">Net</div>
                        <div className="mt-1 text-sm font-semibold text-white sm:text-base">
                          {formatCurrency(getNet(modalData))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <BreakdownCard
                    title="Allowances"
                    entries={allowanceEntries}
                    emptyText="No allowances found."
                  />
                  <BreakdownCard
                    title="Deductions"
                    entries={deductionEntries}
                    emptyText="No deductions found."
                  />
                </div>
              </div>

              <div className="border-t border-white/10 bg-[#0e1b34] px-4 py-4 sm:px-5 md:px-6 2xl:px-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleDownload(modalData)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5800] px-5 text-sm font-extrabold hover:brightness-110 sm:h-12 sm:min-w-[190px] 2xl:h-14 2xl:text-base"
                  >
                    <FaDownload className="text-sm" />
                    Download Payslip
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRow(null);
                      setSelectedEmployeeId("");
                      setDetailNotice("");
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 px-5 text-sm font-semibold hover:bg-white/15 sm:h-12 sm:min-w-[130px] 2xl:h-14 2xl:text-base"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
