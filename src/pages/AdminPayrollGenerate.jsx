import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaEye, FaDownload } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { IoCloseSharp } from "react-icons/io5";
import logoImage from "../assets/favicon.jpeg";

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatHours(value) {
  const n = toNumber(value);
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function formatPdfAmount(value) {
  return `₹${toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPdfNumber(value) {
  return toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

function getEmployeeCode(row) {
  return (
    row?.employee_code ??
    row?.employee?.employee_code ??
    row?.employee?.code ??
    getEmployeeId(row)
  );
}

async function fetchEmployeeNameById(employeeCode) {
  if (!employeeCode || employeeCode === "-") return "-";

  try {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token") || "";

    const response = await fetch(
      `https://yawaytech-portal-backend-python-2.onrender.com/api/${employeeCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    return (
      data?.name ??
      data?.full_name ??
      data?.employee_name ??
      data?.employee?.name ??
      "-"
    );
  } catch {
    return "-";
  }
}

function getEmployeeName(row) {
  return (
    row?.employee_name ??
    row?.name ??
    row?.full_name ??
    row?.employee?.name ??
    row?.employee?.full_name ??
    row?.employee?.employee_name ??
    row?.employee?.first_name ??
    row?.employee_profile?.name ??
    row?.employee_profile?.full_name ??
    row?.summary?.employee_name ??
    "-"
  );
}

function getDepartment(row) {
  return (
    row?.department_name ??
    row?.department ??
    row?.employee?.department_name ??
    row?.employee?.department ??
    row?.employee?.department?.name ??
    row?.employee?.department?.department_name ??
    row?.employee_profile?.department ??
    "-"
  );
}

function getDesignation(row) {
  return (
    row?.designation ??
    row?.designation_name ??
    row?.employee?.designation ??
    row?.employee_designation ??
    row?.employee_profile?.designation ??
    row?.employee_profile?.job_title ??
    "-"
  );
}

function getJoiningDate(row) {
  return (
    row?.date_of_joining ??
    row?.employee?.date_of_joining ??
    row?.employee_profile?.date_of_joining ??
    row?.joining_date ??
    "-"
  );
}

function getPfNo(row) {
  return (
    row?.pf_no ??
    row?.employee?.pf_no ??
    row?.bank?.pf_no ??
    row?.bank_details?.pf_no ??
    "-"
  );
}

function getUanNo(row) {
  return (
    row?.uan_no ??
    row?.employee?.uan_no ??
    row?.bank?.uan_no ??
    row?.bank_details?.uan_no ??
    "-"
  );
}

function getEsicNo(row) {
  return (
    row?.esic_no ??
    row?.employee?.esic_no ??
    row?.bank?.esic_no ??
    row?.bank_details?.esic_no ??
    row?.esi_no ??
    "-"
  );
}

function getPanNo(row) {
  return (
    row?.pan_no ??
    row?.pan_number ??
    row?.employee?.pan_no ??
    row?.employee?.pan_number ??
    row?.employee_profile?.pan_no ??
    "-"
  );
}

function getBankAccountNo(row) {
  return (
    row?.bank_account_no ??
    row?.account_number ??
    row?.employee?.bank_account_no ??
    row?.bank?.account_number ??
    row?.bank_details?.account_number ??
    "-"
  );
}

function getBankName(row) {
  return (
    row?.bank_name ??
    row?.employee?.bank_name ??
    row?.bank?.name ??
    row?.bank?.bank_name ??
    row?.bank_details?.bank_name ??
    "-"
  );
}

function getIfscCode(row) {
  return (
    row?.ifsc_code ??
    row?.employee?.ifsc_code ??
    row?.bank?.ifsc_code ??
    row?.bank_details?.ifsc_code ??
    "-"
  );
}

function getBranchName(row) {
  return (
    row?.branch_name ??
    row?.employee?.branch_name ??
    row?.bank?.branch_name ??
    row?.bank_details?.branch_name ??
    row?.branch ??
    "-"
  );
}

function getPayMode(row) {
  return (
    row?.pay_mode ??
    row?.payment_mode ??
    row?.salary?.pay_mode ??
    row?.bank?.pay_mode ??
    "Bank Transfer"
  );
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
  return (
    row?.weekly_off_days ??
    row?.attendance?.weekly_off_days ??
    row?.attendance_summary?.weekly_off_days ??
    0
  );
}

function getHolidayDays(row) {
  return (
    row?.holiday_days ??
    row?.attendance?.holiday_days ??
    row?.attendance_summary?.holiday_days ??
    0
  );
}

function getAbsentDays(row) {
  return (
    row?.absent_days ??
    row?.attendance?.absent_days ??
    row?.attendance_summary?.absent_days ??
    0
  );
}

function getTotalWorkDays(row) {
  return (
    row?.attendance?.total_work_days ??
    row?.attendance_summary?.total_work_days ??
    row?.total_days ??
    0
  );
}

function getWorkedHours(row) {
  return (
    row?.attendance?.worked_hours ??
    row?.attendance_summary?.worked_hours ??
    0
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

function getWeekendDays(row, monthStart) {
  const fromApi =
    row?.weekend_days ??
    row?.attendance?.weekend_days ??
    row?.attendance_summary?.weekend_days;

  if (Number.isFinite(Number(fromApi))) return Number(fromApi);

  const date = new Date(monthStart);
  if (Number.isNaN(date.getTime())) return getWeeklyOffDays(row);

  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let weekends = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(year, month, day).getDay();
    if (current === 0 || current === 6) weekends += 1;
  }

  return weekends;
}

function getDaysInMonth(monthStart) {
  const date = new Date(monthStart);
  if (Number.isNaN(date.getTime())) return 30;
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getPerDayAmount(row, monthStart) {
  const net = toNumber(getNet(row));
  const totalDays = getDaysInMonth(monthStart);
  return totalDays > 0 ? net / totalDays : 0;
}

function getPresentAmount(row, monthStart) {
  return getPresentDays(row) * getPerDayAmount(row, monthStart);
}

function getWeekendAmount(row, monthStart) {
  return getWeekendDays(row, monthStart) * getPerDayAmount(row, monthStart);
}

function getHolidayAmount(row, monthStart) {
  return getHolidayDays(row) * getPerDayAmount(row, monthStart);
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
    month: "long",
    year: "numeric",
  });
}

function formatMonthUpper(monthStart) {
  if (!monthStart) return "-";
  const date = new Date(monthStart);
  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  }).toUpperCase();
}

function formatDatePretty(value) {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
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
      formatPdfAmount(safeAmount(salary.base || getBase(detail))),
    ],
  ];

  Object.entries(allowances || {}).forEach(([key, value]) => {
    rows.push([formatLabel(key), formatPdfAmount(safeAmount(value))]);
  });

  return rows;
}

function buildDeductionRows(detail) {
  const deductions = getDeductions(detail);
  const rows = [];

  Object.entries(deductions || {}).forEach(([key, value]) => {
    rows.push([formatLabel(key), formatPdfAmount(safeAmount(value))]);
  });

  return rows.length ? rows : [["No Deductions", "-"]];
}

function numberToWordsIndian(num) {
  const n = Math.round(toNumber(num));
  if (!n) return "Zero";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function twoDigits(x) {
    if (x < 20) return ones[x];
    return `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ""}`;
  }

  function threeDigits(x) {
    let str = "";
    if (Math.floor(x / 100) > 0) {
      str += `${ones[Math.floor(x / 100)]} Hundred`;
      if (x % 100) str += " ";
    }
    if (x % 100) str += twoDigits(x % 100);
    return str.trim();
  }

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function drawLabelValue(doc, label, value, x, y, labelWidth = 38, valueX = 68) {
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 78, 99);
  doc.text(String(label).toUpperCase(), x, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 20, 20);
  doc.text(String(value || "-"), valueX, y);
}

function drawAttendanceBox(doc, x, y, w, h, count, label, amountText, colors = {}) {
  const {
    border = [222, 228, 236],
    bg = [255, 255, 255],
    countColor = [0, 0, 0],
    labelColor = [97, 110, 126],
    amountColor = [37, 99, 235],
  } = colors;

  doc.setDrawColor(...border);
  doc.setFillColor(...bg);
  doc.roundedRect(x, y, w, h, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...countColor);
  doc.text(String(count), x + 4, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(...labelColor);
  const lines = doc.splitTextToSize(String(label).toUpperCase(), w - 8);
  doc.text(lines, x + 4, y + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...amountColor);
  doc.text(String(amountText), x + 4, y + h - 4);
}

function downloadPayslipPdf(detail, monthStart) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const employeeName = getEmployeeName(detail);
  const employeeCode = getEmployeeCode(detail);
  const designation = getDesignation(detail);
  const department = getDepartment(detail);
  const joiningDate = formatDatePretty(getJoiningDate(detail));
  const pfNo = getPfNo(detail);
  const uanNo = getUanNo(detail);
  const esicNo = getEsicNo(detail);
  const panNo = getPanNo(detail);
  const bankAccountNo = getBankAccountNo(detail);
  const bankName = getBankName(detail);
  const ifscCode = getIfscCode(detail);
  const branchName = getBranchName(detail);
  const payMode = getPayMode(detail);

  const presentDays = getPresentDays(detail);
  const weekendDays = getWeekendDays(detail, monthStart);
  const holidayDays = getHolidayDays(detail);
  const weeklyOffDays = getWeeklyOffDays(detail);
  const absentDays = getAbsentDays(detail);
  const totalDays = getDaysInMonth(monthStart);

  const perDayAmount = getPerDayAmount(detail, monthStart);
  const presentAmount = getPresentAmount(detail, monthStart);
  const weekendAmount = getWeekendAmount(detail, monthStart);
  const holidayAmount = getHolidayAmount(detail, monthStart);

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

  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(27, 58, 110);
  doc.rect(0, 0, pageWidth, 16, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("YAWAY TECHNOLOGIES PRIVATE LIMITED", pageWidth / 2, 10.2, {
    align: "center",
  });

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 20, 38, 18, 3, 3, "F");
  doc.setDrawColor(230, 235, 241);
  doc.roundedRect(10, 20, 38, 18, 3, 3, "S");

  try {
    doc.addImage(logoImage, "JPEG", 12, 22, 9, 9);
  } catch {
    // ignore image error
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(31, 91, 166);
  doc.text("YAWAY", 23, 27);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.7);
  doc.setTextColor(26, 170, 212);
  doc.text("TECHNOLOGIES", 23, 31);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(34, 48, 78);
  doc.text("SALARY SLIP", pageWidth / 2, 26.2, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(27, 58, 110);
  doc.text(formatMonthUpper(monthStart), pageWidth / 2, 33.2, {
    align: "center",
  });

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 43, 190, 42, 4, 4, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, 43, 190, 42, 4, 4, "S");

  drawLabelValue(doc, "Employee Name", employeeName, 14, 52, 38, 52);
  drawLabelValue(doc, "Employee ID", employeeCode, 14, 59, 38, 52);
  drawLabelValue(doc, "Date of Joining", joiningDate, 14, 66, 38, 52);
  drawLabelValue(doc, "Designation", designation, 14, 73, 38, 52);
  drawLabelValue(doc, "Department", department, 14, 80, 38, 52);

  drawLabelValue(doc, "PAN Number", panNo, 108, 52, 38, 147);
  drawLabelValue(doc, "PF Account No.", pfNo, 108, 59, 38, 147);
  drawLabelValue(doc, "UAN No.", uanNo, 108, 66, 38, 147);
  drawLabelValue(doc, "ESIC No.", esicNo, 108, 73, 38, 147);
  drawLabelValue(doc, "Bank Name", bankName, 108, 80, 38, 147);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 89, 190, 24, 4, 4, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, 89, 190, 24, 4, 4, "S");

  drawLabelValue(
    doc,
    "Account No. / IFSC",
    `${bankAccountNo} / ${ifscCode}`,
    14,
    98,
    42,
    60
  );
  drawLabelValue(doc, "Branch", branchName, 14, 106, 42, 60);

  const boxY1 = 118;
  const boxY2 = 144;
  const boxW = 58;
  const boxH = 22;

  drawAttendanceBox(
    doc,
    10,
    boxY1,
    boxW,
    boxH,
    presentDays,
    "Days Present",
    formatPdfAmount(presentAmount)
  );
  drawAttendanceBox(
    doc,
    76,
    boxY1,
    boxW,
    boxH,
    weekendDays,
    "Weekend Days",
    formatPdfAmount(weekendAmount)
  );
  drawAttendanceBox(
    doc,
    142,
    boxY1,
    boxW,
    boxH,
    holidayDays,
    "Paid Holidays",
    formatPdfAmount(holidayAmount)
  );

  drawAttendanceBox(
    doc,
    10,
    boxY2,
    boxW,
    boxH,
    weeklyOffDays,
    "Weekly Off",
    "—",
    { amountColor: [120, 130, 145] }
  );
  drawAttendanceBox(
    doc,
    76,
    boxY2,
    boxW,
    boxH,
    absentDays,
    "Days Absent (LOP)",
    "—",
    { amountColor: [120, 130, 145] }
  );
  drawAttendanceBox(
    doc,
    142,
    boxY2,
    boxW,
    boxH,
    totalDays,
    "Total Days",
    `₹${formatPdfNumber(perDayAmount)}/day`
  );

  autoTable(doc, {
    startY: 171,
    theme: "grid",
    tableWidth: 92,
    margin: { left: 10 },
    styles: {
      fontSize: 8.8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
      textColor: [31, 41, 55],
      valign: "middle",
    },
    headStyles: {
      fillColor: [27, 58, 110],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    body: [
      [{ content: "EARNINGS", colSpan: 2, styles: { fillColor: [27, 58, 110], textColor: [255, 255, 255], fontStyle: "bold" } }],
      [
        { content: "Component", styles: { fontStyle: "bold", fillColor: [244, 246, 249] } },
        { content: "Amount", styles: { fontStyle: "bold", fillColor: [244, 246, 249], halign: "right" } },
      ],
      ...earningsRows.map(([label, amount]) => [
        { content: label },
        { content: amount, styles: { halign: "right" } },
      ]),
      [
        { content: "Total Earnings", styles: { fontStyle: "bold" } },
        { content: formatPdfAmount(earningsTotal), styles: { fontStyle: "bold", halign: "right" } },
      ],
    ],
    didParseCell(data) {
      if (data.row.index === 0) {
        data.cell.styles.halign = "left";
      }
    },
  });

  autoTable(doc, {
    startY: 171,
    theme: "grid",
    tableWidth: 92,
    margin: { left: 108 },
    styles: {
      fontSize: 8.8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
      textColor: [31, 41, 55],
      valign: "middle",
    },
    headStyles: {
      fillColor: [27, 58, 110],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    body: [
      [{ content: "DEDUCTIONS", colSpan: 2, styles: { fillColor: [27, 58, 110], textColor: [255, 255, 255], fontStyle: "bold" } }],
      [
        { content: "Component", styles: { fontStyle: "bold", fillColor: [244, 246, 249] } },
        { content: "Amount", styles: { fontStyle: "bold", fillColor: [244, 246, 249], halign: "right" } },
      ],
      ...deductionRows.map(([label, amount]) => [
        { content: label },
        { content: amount, styles: { halign: "right" } },
      ]),
      [
        { content: "Total Deductions", styles: { fontStyle: "bold" } },
        { content: formatPdfAmount(deductionsTotal), styles: { fontStyle: "bold", halign: "right" } },
      ],
    ],
    didParseCell(data) {
      if (data.row.index === 0) {
        data.cell.styles.halign = "left";
      }
    },
  });

  const bottomTableY = Math.max(
    doc.lastAutoTable?.finalY || 220,
    220
  );

  doc.setFillColor(27, 58, 110);
  doc.roundedRect(10, bottomTableY + 6, 190, 14, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`NET PAY FOR ${formatMonthUpper(monthStart)}`, 14, bottomTableY + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(formatPdfAmount(netSalary), 194, bottomTableY + 15, { align: "right" });

  const detailsStartY = bottomTableY + 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 115);
  doc.text("PAY MODE", 12, detailsStartY);
  doc.setTextColor(31, 41, 55);
  doc.text(String(payMode), 12, detailsStartY + 5.5);

  doc.setTextColor(90, 100, 115);
  doc.text("AMOUNT IN WORDS", 12, detailsStartY + 15);
  doc.setTextColor(31, 41, 55);
  doc.text(
    `Rupees ${numberToWordsIndian(netSalary)} Only`,
    12,
    detailsStartY + 20.5
  );

  const signY = detailsStartY + 35;
  doc.setDrawColor(210, 216, 224);
  doc.line(16, signY, 56, signY);
  doc.line(82, signY, 122, signY);
  doc.line(148, signY, 188, signY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 100, 115);
  doc.text("Employee Signature", 36, signY + 5.5, { align: "center" });
  doc.text("HR Manager", 102, signY + 5.5, { align: "center" });
  doc.text("Authorised Signatory", 168, signY + 5.5, { align: "center" });

  doc.setDrawColor(220, 225, 232);
  doc.line(10, 278, 200, 278);

  doc.setFontSize(7.5);
  doc.setTextColor(110, 118, 130);
  doc.text(
    "This is a computer-generated payslip and does not require a physical signature · Yaway Technologies Private Limited",
    pageWidth / 2,
    283,
    { align: "center" }
  );

  doc.save(`Payslip-${employeeCode}-${monthStart}.pdf`);
}

function SummaryCard({ label, value }) {
  return (
    <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-2 break-words text-base font-bold sm:text-lg 2xl:text-xl">
        {value}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="h-full rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-white sm:text-base">
        {value}
      </div>
    </div>
  );
}

function BreakdownCard({ title, entries, emptyText = "No data" }) {
  return (
    <div className="h-full rounded-2xl border border-white/10 bg-white/5">
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
    (state) => state.payrollGenerate?.loadingDetailById || {}
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
      { gross: 0, net: 0 }
    );
  }, [filteredRows]);

  const selectedDetail = useSelector((state) =>
    selectedEmployeeId
      ? selectPayrollDetailByKey(state, selectedEmployeeId, monthStart)
      : null
  );

  const selectedDetailLoading = selectedEmployeeId
    ? !!loadingDetailById[String(selectedEmployeeId)]
    : false;

  const modalData = selectedDetail || selectedRow;
  const allowanceEntries = normalizeEntries(getAllowances(modalData));
  const deductionEntries = normalizeEntries(getDeductions(modalData));

  const loadPayrollList = async () => {
    if (!monthStart) return;

    const result = await dispatch(fetchPayrollListThunk({ monthStart }));
    setHasLoadedOnce(true);

    if (fetchPayrollListThunk.fulfilled.match(result)) {
      const apiRows = result.payload?.data || [];

      const rowsWithNames = await Promise.all(
        apiRows.map(async (row) => {
          const empCode = getEmployeeCode(row);
          const fetchedName = await fetchEmployeeNameById(empCode);
          return { ...row, employee_name: fetchedName };
        })
      );

      setPageRows(rowsWithNames);
    } else {
      setPageRows([]);
    }
  };

  useEffect(() => {
    loadPayrollList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthStart]);

  const handleView = async (row) => {
    const employeeId = String(getEmployeeCode(row));
    if (!employeeId || employeeId === "-") return;

    setSelectedRow(row);
    setSelectedEmployeeId(employeeId);
    setDetailNotice("");

    const result = await dispatch(
      fetchEmployeePayrollDetailThunk({ employeeId, monthStart })
    );

    if (fetchEmployeePayrollDetailThunk.rejected.match(result)) {
      setDetailNotice(
        "Detailed employee API failed. Showing available summary data."
      );
    }
  };

  const handleDownload = (row) => {
    if (!row) return;
    downloadPayslipPdf(row, monthStart);
  };

  return (
    <>
      <div className="min-h-screen w-full overflow-x-hidden px-3 py-3 text-white sm:px-4 sm:py-4 md:px-5 lg:px-6 xl:px-7 2xl:px-8">
        <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1830] via-[#17264f] to-[#24386e] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="border-b border-white/10 px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-7 2xl:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold leading-none tracking-wide sm:text-3xl lg:text-4xl 2xl:text-5xl">
                  Payroll Generate
                </h1>
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
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 disabled:opacity-60 sm:h-11 sm:w-11 md:h-12 md:w-12 2xl:h-14 2xl:w-14"
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
                        const employeeId = String(getEmployeeCode(row));
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
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-bold text-blue-200 hover:bg-blue-500/25 disabled:opacity-60"
                                title="View"
                              >
                                <FaEye className="text-sm" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(row)}
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-bold text-emerald-200 hover:bg-emerald-500/25"
                                title="Download"
                              >
                                <FaDownload className="text-sm" />
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
                          const employeeId = String(getEmployeeCode(row));
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
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-200 hover:bg-blue-500/25 disabled:opacity-60"
                                    title="View"
                                  >
                                    <FaEye className="text-sm" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownload(row)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                                    title="Download"
                                  >
                                    <FaDownload className="text-sm" />
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-0 backdrop-blur-sm sm:p-3 md:p-4 lg:pl-[264px] lg:pb-4 lg:pr-4 lg:pt-4 xl:pl-[284px] 2xl:pl-[304px]">
          <div className="flex h-full max-w-full w-full flex-col overflow-hidden rounded-none border border-white/10 bg-[#0e1b34] text-white shadow-2xl sm:h-auto sm:max-h-[95vh] sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0e1b34] px-4 py-3 sm:px-5 sm:py-4 md:px-6 2xl:px-8 2xl:py-5">
              <div className="min-w-0 pr-3">
                <h2 className="text-base font-extrabold sm:text-lg md:text-xl 2xl:text-2xl">
                  Employee Payroll Detail
                </h2>
                <p className="mt-0.5 text-[11px] text-white/50 sm:text-xs md:text-sm 2xl:text-base">
                  {getEmployeeName(modalData)} · {getEmployeeCode(modalData)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRow(null);
                  setSelectedEmployeeId("");
                  setDetailNotice("");
                }}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 sm:h-9 sm:w-9 md:h-10 md:w-10"
              >
                <IoCloseSharp className="text-base sm:text-lg md:text-xl" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 2xl:px-8 2xl:py-6">
              {selectedDetailLoading && (
                <div className="mb-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-100 sm:text-sm">
                  Loading employee details...
                </div>
              )}

              {detailNotice && (
                <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 sm:text-sm">
                  {detailNotice}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 2xl:gap-4">
                <InfoCard
                  label="Employee ID"
                  value={String(getEmployeeCode(modalData))}
                />
                <InfoCard
                  label="Employee Name"
                  value={getEmployeeName(modalData)}
                />
                <InfoCard label="Department" value={getDepartment(modalData)} />
                <InfoCard
                  label="Designation"
                  value={getDesignation(modalData)}
                />
                <InfoCard label="Month Start" value={monthStart} />
                <InfoCard
                  label="Date of Joining"
                  value={formatDatePretty(getJoiningDate(modalData))}
                />
                <InfoCard label="PF Number" value={getPfNo(modalData)} />
                <InfoCard label="UAN Number" value={getUanNo(modalData)} />
                <InfoCard label="PAN Number" value={getPanNo(modalData)} />
                <InfoCard label="ESIC Number" value={getEsicNo(modalData)} />
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
                <InfoCard
                  label="Bank Account No"
                  value={getBankAccountNo(modalData)}
                />
                <InfoCard label="Bank Name" value={getBankName(modalData)} />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5">
                  <div className="border-b border-white/10 px-3 py-2 text-xs font-bold text-white/90 sm:px-4 sm:py-3 sm:text-sm">
                    Attendance Details
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-2 sm:p-4 md:grid-cols-3">
                    {[
                      ["Present Days", getPresentDays(modalData)],
                      ["Weekend Days", getWeekendDays(modalData, monthStart)],
                      ["Paid Holidays", getHolidayDays(modalData)],
                      ["Weekly Off", getWeeklyOffDays(modalData)],
                      ["Days Absent", getAbsentDays(modalData)],
                      ["Total Days", getDaysInMonth(monthStart)],
                    ].map(([label, val]) => (
                      <div
                        key={label}
                        className="rounded-lg bg-white/[0.04] px-3 py-2"
                      >
                        <div className="text-[10px] text-white/50 sm:text-xs">
                          {label}
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-white sm:text-sm">
                          {val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5">
                    <div className="border-b border-white/10 px-3 py-2 text-xs font-bold text-white/90 sm:px-4 sm:py-3 sm:text-sm">
                      Salary Snapshot
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-3 sm:p-4">
                      {[
                        ["Base", formatCurrency(getBase(modalData))],
                        ["Gross", formatCurrency(getGross(modalData))],
                        ["Net", formatCurrency(getNet(modalData))],
                      ].map(([label, val]) => (
                        <div
                          key={label}
                          className="rounded-lg bg-white/[0.04] px-3 py-2"
                        >
                          <div className="text-[10px] text-white/50 sm:text-xs">
                            {label}
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-white sm:text-sm">
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <BreakdownCard
                      title="Allowances"
                      entries={allowanceEntries}
                      emptyText="No allowances."
                    />
                    <BreakdownCard
                      title="Deductions"
                      entries={deductionEntries}
                      emptyText="No deductions."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 bg-[#0e1b34] px-3 py-3 sm:px-4 sm:py-4 md:px-6 2xl:px-8">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDownload(modalData)}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#FF5800] px-4 text-xs font-extrabold transition hover:brightness-110 sm:h-10 sm:w-auto sm:px-5 sm:text-sm md:h-11 md:px-6 2xl:h-13"
                >
                  <FaDownload className="text-xs sm:text-sm" />
                  Download Payslip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}