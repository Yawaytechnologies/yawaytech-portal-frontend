// src/components/EmployeeSide/Payslip.jsx

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaDownload, FaEye } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import logoImage from "../../assets/favicon.jpeg";

import { fetchEmployeePayrollDetailThunk } from "../../redux/actions/payrollGenerateActions";
import {
  selectPayrollDetailByKey,
  selectPayrollDetailLoadingById,
  selectPayrollDetailError,
} from "../../redux/reducer/payrollGenerateSlice";
import { selectEmployeeId } from "../../redux/reducer/authSlice";

/* ---------------- basic helpers ---------------- */

function safeStr(value, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
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

function formatPdfAmount(value) {
  return `Rs. ${toNumber(value).toLocaleString("en-IN", {
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

function getMonthStart(monthValue) {
  return monthValue ? `${monthValue}-01` : "";
}

function getMonthTitle(monthStart) {
  if (!monthStart) return "-";

  const date = new Date(monthStart);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getMonthShortUpper(monthStart) {
  if (!monthStart) return "-";

  const date = new Date(monthStart);
  if (Number.isNaN(date.getTime())) return "-";

  return date
    .toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
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

function formatLabel(key) {
  return String(key || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* ---------------- data extractors ---------------- */

function getEmployeeCode(row) {
  return (
    row?.employee_code ??
    row?.employee_id ??
    row?.employee?.employee_code ??
    row?.employee?.employee_id ??
    row?.employee?.id ??
    row?.id ??
    "-"
  );
}

function getEmployeeName(row) {
  return (
    row?.employee_name ??
    row?.name ??
    row?.full_name ??
    row?.employee?.name ??
    row?.employee?.full_name ??
    row?.employee?.employee_name ??
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
    "-"
  );
}

function getDesignation(row) {
  return (
    row?.designation ??
    row?.designation_name ??
    row?.employee_designation ??
    row?.employee?.designation ??
    "-"
  );
}

function getJoiningDate(row) {
  return (
    row?.date_of_joining ??
    row?.joining_date ??
    row?.employee?.date_of_joining ??
    row?.employee?.joining_date ??
    "-"
  );
}

function getPfNo(row) {
  return (
    row?.pf_number ??
    row?.pf_no ??
    row?.employee?.pf_number ??
    row?.employee?.pf_no ??
    row?.bank?.pf_no ??
    row?.bank_details?.pf_no ??
    "-"
  );
}

function getUanNo(row) {
  return (
    row?.uan_number ??
    row?.uan_no ??
    row?.employee?.uan_number ??
    row?.employee?.uan_no ??
    row?.bank?.uan_no ??
    row?.bank_details?.uan_no ??
    "-"
  );
}

function getEsicNo(row) {
  return (
    row?.esic_number ??
    row?.esic_no ??
    row?.esi_number ??
    row?.esi_no ??
    row?.employee?.esic_number ??
    row?.employee?.esic_no ??
    row?.employee?.esi_number ??
    row?.employee?.esi_no ??
    "-"
  );
}

function getPanNo(row) {
  return (
    row?.pan_number ??
    row?.pan_no ??
    row?.employee?.pan_number ??
    row?.employee?.pan_no ??
    "-"
  );
}

function getBankAccountNo(row) {
  return (
    row?.bank_account_no ??
    row?.account_number ??
    row?.employee?.bank_account_no ??
    row?.employee?.account_number ??
    row?.bank?.account_number ??
    row?.bank_details?.account_number ??
    "-"
  );
}

function getBankName(row) {
  return (
    row?.bank_name ??
    row?.employee?.bank_name ??
    row?.bank?.bank_name ??
    row?.bank?.name ??
    row?.bank_details?.bank_name ??
    "-"
  );
}

function getIfscCode(row) {
  return (
    row?.ifsc_code ??
    row?.bank_ifsc ??
    row?.employee?.ifsc_code ??
    row?.employee?.bank_ifsc ??
    row?.bank?.ifsc_code ??
    row?.bank_details?.ifsc_code ??
    "-"
  );
}

function getBranchName(row) {
  return (
    row?.branch_name ??
    row?.bank_branch ??
    row?.employee?.branch_name ??
    row?.employee?.bank_branch ??
    row?.bank?.branch_name ??
    row?.bank_details?.branch_name ??
    row?.branch ??
    "-"
  );
}

function getPayMode(row) {
  return (
    row?.pay_mode ??
    row?.payMode ??
    row?.payment_mode ??
    row?.salary?.pay_mode ??
    "Bank Transfer"
  );
}

function getBase(row) {
  return (
    row?.salary?.base ??
    row?.salary?.base_salary ??
    row?.base_salary ??
    row?.basic_salary ??
    row?.salary_breakdown?.base_salary ??
    row?.summary?.base_salary ??
    0
  );
}

function getGross(row) {
  return (
    row?.salary?.gross ??
    row?.salary?.gross_salary ??
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
    row?.salary?.net_salary ??
    row?.net_salary ??
    row?.net ??
    row?.net_pay ??
    row?.salary_breakdown?.net_salary ??
    row?.summary?.net_salary ??
    0
  );
}

function getPresentDays(row) {
  return (
    row?.present_days ??
    row?.attendance?.present_days ??
    row?.attendance_details?.present_days ??
    row?.attendance_summary?.present_days ??
    0
  );
}

function getWeekendDays(row, monthStart) {
  const fromApi =
    row?.weekend_days ??
    row?.attendance?.weekend_days ??
    row?.attendance_details?.weekend_days ??
    row?.attendance_summary?.weekend_days;

  if (Number.isFinite(Number(fromApi))) return Number(fromApi);

  const date = new Date(monthStart);
  if (Number.isNaN(date.getTime())) return 0;

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

function getHolidayDays(row) {
  return (
    row?.paid_holidays ??
    row?.holiday_days ??
    row?.holidays ??
    row?.attendance?.paid_holidays ??
    row?.attendance?.holiday_days ??
    row?.attendance_details?.paid_holidays ??
    row?.attendance_summary?.holiday_days ??
    0
  );
}

function getWeeklyOffDays(row) {
  return (
    row?.weekly_off ??
    row?.weekly_off_days ??
    row?.week_off ??
    row?.attendance?.weekly_off ??
    row?.attendance?.weekly_off_days ??
    row?.attendance?.week_off ??
    row?.attendance_details?.weekly_off ??
    row?.attendance_details?.week_off ??
    0
  );
}

function getAbsentDays(row) {
  return (
    row?.days_absent ??
    row?.absent_days ??
    row?.attendance?.absent_days ??
    row?.attendance_details?.absent_days ??
    row?.attendance_summary?.absent_days ??
    0
  );
}

function getDaysInMonth(monthStart, row) {
  const fromApi =
    row?.total_days ??
    row?.days_in_month ??
    row?.attendance?.total_days ??
    row?.attendance_details?.total_days;

  if (Number.isFinite(Number(fromApi)) && Number(fromApi) > 0) {
    return Number(fromApi);
  }

  const date = new Date(monthStart);
  if (Number.isNaN(date.getTime())) return 30;

  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function objectFromBreakdownArray(arr, fallbackName) {
  if (!Array.isArray(arr)) return {};

  return arr.reduce((acc, item, index) => {
    const label =
      item?.rule_name ||
      item?.name ||
      item?.allowance_name ||
      item?.deduction_name ||
      `${fallbackName} ${index + 1}`;

    acc[label] = item?.amount ?? item?.value ?? 0;
    return acc;
  }, {});
}

function getAllowances(detail) {
  const fromArray = objectFromBreakdownArray(
    detail?.breakdown?.allowances,
    "Allowance",
  );

  if (Object.keys(fromArray).length) return fromArray;

  return (
    detail?.allowances ??
    detail?.salary_breakdown?.allowances ??
    detail?.breakdown?.allowances ??
    {}
  );
}

function getDeductions(detail) {
  const fromArray = objectFromBreakdownArray(
    detail?.breakdown?.deductions,
    "Deduction",
  );

  if (Object.keys(fromArray).length) return fromArray;

  return (
    detail?.deductions ??
    detail?.salary_breakdown?.deductions ??
    detail?.breakdown?.deductions ??
    {}
  );
}

function normalizeEntries(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  return Object.entries(obj);
}

function safeAmount(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function buildEarningsRows(detail) {
  const allowances = getAllowances(detail);

  const rows = [["Basic Salary", formatPdfAmount(safeAmount(getBase(detail)))]];

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

/* ---------------- pdf drawing helpers ---------------- */

function drawAttendanceBox(
  doc,
  x,
  y,
  w,
  h,
  count,
  label,
  amountText,
  colors = {},
) {
  const {
    border = [205, 212, 224],
    bg = [244, 244, 244],
    countColor = [27, 58, 110],
    labelColor = [98, 110, 128],
    amountColor = [0, 102, 255],
  } = colors;

  doc.setDrawColor(...border);
  doc.setFillColor(...bg);
  doc.rect(x, y, w, h, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15.5);
  doc.setTextColor(...countColor);
  doc.text(String(count), x + w / 2, y + 7.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.1);
  doc.setTextColor(...labelColor);

  const labelLines = doc.splitTextToSize(String(label).toUpperCase(), w - 4);
  doc.text(labelLines, x + w / 2, y + 13, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...amountColor);
  doc.text(String(amountText || "-"), x + w / 2, y + h - 2.8, {
    align: "center",
  });
}

/* ---------------- direct jsPDF download ---------------- */

function downloadPayslipPdf(detail, monthStart) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

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
  const totalDays = getDaysInMonth(monthStart, detail);

  const netSalary = getNet(detail);
  const grossSalary = getGross(detail);
  const perDayAmount = totalDays > 0 ? grossSalary / totalDays : 0;

  const presentAmount = presentDays * perDayAmount;
  const weekendAmount = weekendDays * perDayAmount;
  const holidayAmount = holidayDays * perDayAmount;

  const earningsRows = buildEarningsRows(detail);
  const deductionRows = buildDeductionRows(detail);

  const earningsTotal = earningsRows.reduce((sum, row) => {
    const raw = String(row[1])
      .replace(/Rs\.\s?|₹|,/g, "")
      .trim();
    return sum + safeAmount(raw);
  }, 0);

  const deductionsTotal = deductionRows.reduce((sum, row) => {
    const raw = String(row[1])
      .replace(/Rs\.\s?|₹|,|-/g, "")
      .trim();
    return sum + safeAmount(raw);
  }, 0);

  const slipMonth = getMonthShortUpper(monthStart);

  const leftMargin = 6;
  const rightMargin = 6;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  const infoX = leftMargin;
  const infoY = 40;
  const infoW = contentWidth;
  const infoH = 30;
  const colW = infoW / 4;

  const attendY = 72;
  const attendH = 20;
  const attendW = infoW / 6;

  function drawInfoItem(label, value, x, y) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(100, 112, 130);
    doc.text(String(label).toUpperCase(), x, y);

    const valueLines = doc.splitTextToSize(String(value || "-"), colW - 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(33, 43, 59);
    doc.text(valueLines, x, y + 4.7);
  }

  doc.setFillColor(240, 242, 246);
  doc.rect(0, 0, pageWidth, 297, "F");

  doc.setFillColor(27, 58, 110);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(5, 8, 16, 12, 2, 2, "F");

  try {
    doc.addImage(logoImage, "JPEG", 7.2, 9.4, 9, 9);
  } catch {
    // ignore logo issue
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(255, 255, 255);
  doc.text("YAWAY", 24, 13.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.7);
  doc.setTextColor(255, 255, 255);
  doc.text("TECHNOLOGIES", 24, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Yaway Technologies Pvt Ltd", pageWidth / 2, 15.5, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Salary Slip", pageWidth - 8, 13.5, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(slipMonth, pageWidth - 8, 19, {
    align: "right",
  });

  doc.setDrawColor(27, 58, 110);
  doc.setLineWidth(0.8);
  doc.line(0, 28, pageWidth, 28);

  doc.setFillColor(233, 236, 241);
  doc.rect(infoX, infoY, infoW, infoH, "F");
  doc.setDrawColor(189, 198, 210);
  doc.rect(infoX, infoY, infoW, infoH);

  doc.setDrawColor(190, 198, 210);
  doc.line(infoX + colW, infoY, infoX + colW, infoY + infoH);
  doc.line(infoX + colW * 2, infoY, infoX + colW * 2, infoY + infoH);
  doc.line(infoX + colW * 3, infoY, infoX + colW * 3, infoY + infoH);

  drawInfoItem("Employee Name", employeeName, infoX + 3, infoY + 5);
  drawInfoItem("Employee ID", employeeCode, infoX + 3, infoY + 14);
  drawInfoItem("Date of Joining", joiningDate, infoX + 3, infoY + 23);

  drawInfoItem("Designation", designation, infoX + colW + 3, infoY + 5);
  drawInfoItem("Department", department, infoX + colW + 3, infoY + 14);
  drawInfoItem("PAN Number", panNo, infoX + colW + 3, infoY + 23);

  drawInfoItem("PF Account No.", pfNo, infoX + colW * 2 + 3, infoY + 5);
  drawInfoItem("UAN No.", uanNo, infoX + colW * 2 + 3, infoY + 14);
  drawInfoItem("ESIC No.", esicNo, infoX + colW * 2 + 3, infoY + 23);

  drawInfoItem("Bank Name", bankName, infoX + colW * 3 + 3, infoY + 5);
  drawInfoItem(
    "Account No. / IFSC",
    `${bankAccountNo} / ${ifscCode}`,
    infoX + colW * 3 + 3,
    infoY + 14,
  );
  drawInfoItem("Branch", branchName, infoX + colW * 3 + 3, infoY + 23);

  drawAttendanceBox(
    doc,
    infoX + attendW * 0,
    attendY,
    attendW,
    attendH,
    presentDays,
    "Days Present",
    formatPdfAmount(presentAmount),
  );

  drawAttendanceBox(
    doc,
    infoX + attendW * 1,
    attendY,
    attendW,
    attendH,
    weekendDays,
    "Weekend Days",
    formatPdfAmount(weekendAmount),
  );

  drawAttendanceBox(
    doc,
    infoX + attendW * 2,
    attendY,
    attendW,
    attendH,
    holidayDays,
    "Paid Holidays",
    formatPdfAmount(holidayAmount),
  );

  drawAttendanceBox(
    doc,
    infoX + attendW * 3,
    attendY,
    attendW,
    attendH,
    weeklyOffDays,
    "Weekly Off",
    "-",
    {
      amountColor: [120, 130, 145],
    },
  );

  drawAttendanceBox(
    doc,
    infoX + attendW * 4,
    attendY,
    attendW,
    attendH,
    absentDays,
    "Days Absent (LOP)",
    "-",
    {
      countColor: [220, 38, 38],
      amountColor: [220, 38, 38],
    },
  );

  drawAttendanceBox(
    doc,
    infoX + attendW * 5,
    attendY,
    attendW,
    attendH,
    totalDays,
    "Total Days",
    `${formatPdfNumber(perDayAmount)}/day`,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(27, 58, 110);
  doc.text("EARNINGS", leftMargin, 98.5);
  doc.line(leftMargin, 101, leftMargin + 96, 101);

  doc.text("DEDUCTIONS", 106, 98.5);
  doc.line(106, 101, 204, 101);

  autoTable(doc, {
    startY: 104,
    margin: { left: leftMargin },
    tableWidth: 96,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [205, 212, 224],
      lineWidth: 0.3,
      textColor: [31, 41, 55],
      valign: "middle",
    },
    body: [
      [
        {
          content: "Component",
          styles: {
            fontStyle: "bold",
            fillColor: [27, 58, 110],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "Amount",
          styles: {
            fontStyle: "bold",
            fillColor: [27, 58, 110],
            textColor: [255, 255, 255],
            halign: "right",
          },
        },
      ],
      ...earningsRows.map(([label, amount]) => [
        { content: label },
        { content: amount, styles: { halign: "right" } },
      ]),
      [
        {
          content: "Total Earnings",
          styles: {
            fontStyle: "bold",
            fillColor: [228, 234, 244],
            textColor: [27, 58, 110],
          },
        },
        {
          content: formatPdfAmount(earningsTotal),
          styles: {
            fontStyle: "bold",
            halign: "right",
            fillColor: [228, 234, 244],
            textColor: [27, 58, 110],
          },
        },
      ],
    ],
  });

  const earningsEndY = doc.lastAutoTable.finalY;

  autoTable(doc, {
    startY: 104,
    margin: { left: 106 },
    tableWidth: 98,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [205, 212, 224],
      lineWidth: 0.3,
      textColor: [31, 41, 55],
      valign: "middle",
    },
    body: [
      [
        {
          content: "Component",
          styles: {
            fontStyle: "bold",
            fillColor: [27, 58, 110],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "Amount",
          styles: {
            fontStyle: "bold",
            fillColor: [27, 58, 110],
            textColor: [255, 255, 255],
            halign: "right",
          },
        },
      ],
      ...deductionRows.map(([label, amount]) => [
        { content: label },
        { content: amount, styles: { halign: "right" } },
      ]),
      [
        {
          content: "Total Deductions",
          styles: {
            fontStyle: "bold",
            fillColor: [228, 234, 244],
            textColor: [27, 58, 110],
          },
        },
        {
          content: formatPdfAmount(deductionsTotal),
          styles: {
            fontStyle: "bold",
            halign: "right",
            fillColor: [228, 234, 244],
            textColor: [27, 58, 110],
          },
        },
      ],
    ],
  });

  const deductionsEndY = doc.lastAutoTable.finalY;
  const bottomTableY = Math.max(earningsEndY, deductionsEndY) + 6;

  doc.setFillColor(27, 58, 110);
  doc.roundedRect(leftMargin, bottomTableY, contentWidth, 19, 3, 3, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(185, 201, 229);
  doc.text(`NET PAY FOR ${slipMonth}`, leftMargin + 5, bottomTableY + 6.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(formatPdfAmount(netSalary), leftMargin + 5, bottomTableY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(185, 201, 229);
  doc.text("PAY MODE", pageWidth - rightMargin - 4, bottomTableY + 9, {
    align: "right",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(String(payMode), pageWidth - rightMargin - 4, bottomTableY + 14, {
    align: "right",
  });

  const wordsY = bottomTableY + 25;

  doc.setDrawColor(185, 195, 210);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1, 1], 0);
  doc.roundedRect(leftMargin, wordsY, contentWidth, 12, 1.5, 1.5, "S");
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(98, 110, 128);
  doc.text("AMOUNT IN WORDS", leftMargin + 3, wordsY + 4.2);

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(8);
  doc.setTextColor(31, 41, 55);
  doc.text(
    `Rupees ${numberToWordsIndian(netSalary)} Only`,
    leftMargin + 3,
    wordsY + 9,
  );

  const signY = wordsY + 22;

  doc.setDrawColor(130, 150, 190);
  doc.line(leftMargin, signY, leftMargin + 58, signY);
  doc.line(leftMargin + 67, signY, leftMargin + 125, signY);
  doc.line(leftMargin + 134, signY, leftMargin + 192, signY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(78, 92, 115);
  doc.text("Employee Signature", leftMargin, signY + 5.5);
  doc.text("HR Manager", leftMargin + 67, signY + 5.5);
  doc.text("Authorised Signatory", leftMargin + 134, signY + 5.5);

  doc.save(`Payslip-${employeeCode}-${monthStart}.pdf`);
}

/* ---------------- UI cards ---------------- */

function InfoCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-2 break-words text-[13px] font-extrabold text-slate-900">
        {safeStr(value)}
      </div>
    </div>
  );
}

function MiniCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-[13px] font-extrabold text-slate-900">
        {safeStr(value)}
      </div>
    </div>
  );
}

function AmountRow({ name, amount }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className="min-w-0 truncate text-[13px] font-bold capitalize text-slate-700">
        {formatLabel(name)}
      </span>

      <span className="shrink-0 text-[13px] font-extrabold text-[#1b3a6e]">
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

/* ---------------- component ---------------- */

export default function Payslip() {
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);

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

    dispatch(
      fetchEmployeePayrollDetailThunk({
        employeeId,
        monthStart,
      }),
    );
  }, [dispatch, employeeId, monthStart]);

  useEffect(() => {
    if (!open) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [open]);

  const allowances = useMemo(() => getAllowances(detail || {}), [detail]);
  const deductions = useMemo(() => getDeductions(detail || {}), [detail]);

  const deductionTotal = useMemo(() => {
    return Object.values(deductions || {}).reduce(
      (sum, value) => sum + toNumber(value),
      0,
    );
  }, [deductions]);

  const data = useMemo(() => {
    if (!detail) return null;

    const baseSalary = toNumber(getBase(detail));

    const allowanceTotal = Object.values(allowances || {}).reduce(
      (sum, value) => sum + toNumber(value),
      0,
    );

    const grossSalary =
      toNumber(getGross(detail)) || baseSalary + allowanceTotal;

    const netSalary = toNumber(getNet(detail)) || grossSalary - deductionTotal;

    return {
      ...detail,
      base_salary: baseSalary,
      gross_salary: grossSalary,
      net_salary: netSalary,
    };
  }, [detail, allowances, deductionTotal]);

  const handleRetry = () => {
    if (!employeeId || !monthStart) return;

    dispatch(
      fetchEmployeePayrollDetailThunk({
        employeeId,
        monthStart,
      }),
    );
  };

  const handleDownload = () => {
    if (!data) return;
    downloadPayslipPdf(data, monthStart);
  };

  const monthTitle = getMonthTitle(monthStart);

  return (
    <div className="w-full">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Payslip</h1>

            <p className="mt-1 text-sm text-slate-500">
              View and download your monthly salary slip
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-600">
              Month
            </label>

            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-5">
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                Loading payslip...
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <h3 className="font-extrabold text-red-700">
                Failed to load payslip
              </h3>

              <p className="mt-1 text-sm text-red-500">{error}</p>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && !detail && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900">
                No payslip found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                No payroll data available for {monthTitle}.
              </p>
            </div>
          )}

          {!loading && !error && detail && data && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {monthTitle} Payslip
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {safeStr(getEmployeeName(data))} -{" "}
                    {safeStr(getEmployeeCode(data))}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      Gross: {formatCurrency(getGross(data))}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      Deductions: {formatCurrency(deductionTotal)}
                    </span>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      Net: {formatCurrency(getNet(data))}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50"
                  >
                    <FaEye />
                    View Details
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5800] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#e94f00]"
                  >
                    <FaDownload />
                    Download Payslip
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {open && data
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3"
              onClick={() => setOpen(false)}
            >
              <div
                className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-xl bg-slate-100 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                <div className="max-h-[92vh] overflow-y-auto">
                  <div className="border-b border-blue-900 bg-gradient-to-r from-[#1b3a6e] to-[#2563eb] px-4 py-4 sm:px-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-extrabold text-white">
                          Employee Payroll Detail
                        </h2>

                        <p className="mt-1 text-xs font-medium text-blue-100">
                          {safeStr(getEmployeeName(data))} ·{" "}
                          {safeStr(getEmployeeCode(data))}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
                        aria-label="Close"
                      >
                        <IoClose size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <InfoCard
                        label="Employee ID"
                        value={getEmployeeCode(data)}
                      />

                      <InfoCard
                        label="Employee Name"
                        value={getEmployeeName(data)}
                      />

                      <InfoCard
                        label="Department"
                        value={getDepartment(data)}
                      />

                      <InfoCard
                        label="Designation"
                        value={getDesignation(data)}
                      />

                      <InfoCard label="Month Start" value={monthStart} />

                      <InfoCard
                        label="Date of Joining"
                        value={formatDatePretty(getJoiningDate(data))}
                      />

                      <InfoCard label="PF Number" value={getPfNo(data)} />

                      <InfoCard label="UAN Number" value={getUanNo(data)} />

                      <InfoCard label="PAN Number" value={getPanNo(data)} />

                      <InfoCard label="ESIC Number" value={getEsicNo(data)} />

                      <InfoCard
                        label="Base Salary"
                        value={formatCurrency(getBase(data))}
                      />

                      <InfoCard
                        label="Gross Salary"
                        value={formatCurrency(getGross(data))}
                      />

                      <InfoCard
                        label="Net Salary"
                        value={formatCurrency(getNet(data))}
                      />

                      <InfoCard
                        label="Present Days"
                        value={getPresentDays(data)}
                      />

                      <InfoCard
                        label="Bank Account No"
                        value={getBankAccountNo(data)}
                      />

                      <InfoCard label="Bank Name" value={getBankName(data)} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            Attendance Details
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-3">
                          <MiniCard
                            label="Present Days"
                            value={getPresentDays(data)}
                          />

                          <MiniCard
                            label="Weekend Days"
                            value={getWeekendDays(data, monthStart)}
                          />

                          <MiniCard
                            label="Paid Holidays"
                            value={getHolidayDays(data)}
                          />

                          <MiniCard
                            label="Weekly Off"
                            value={getWeeklyOffDays(data)}
                          />

                          <MiniCard
                            label="Days Absent"
                            value={getAbsentDays(data)}
                          />

                          <MiniCard
                            label="Total Days"
                            value={getDaysInMonth(monthStart, data)}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                          <div className="border-b border-slate-200 px-4 py-3">
                            <h3 className="text-sm font-extrabold text-slate-900">
                              Salary Snapshot
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-3">
                            <MiniCard
                              label="Base"
                              value={formatCurrency(getBase(data))}
                            />

                            <MiniCard
                              label="Gross"
                              value={formatCurrency(getGross(data))}
                            />

                            <MiniCard
                              label="Net"
                              value={formatCurrency(getNet(data))}
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                            <div className="border-b border-slate-200 px-4 py-3">
                              <h3 className="text-sm font-extrabold text-slate-900">
                                Allowances
                              </h3>
                            </div>

                            <div className="space-y-2 p-4">
                              {normalizeEntries(allowances).length ? (
                                normalizeEntries(allowances).map(
                                  ([name, amount]) => (
                                    <AmountRow
                                      key={name}
                                      name={name}
                                      amount={amount}
                                    />
                                  ),
                                )
                              ) : (
                                <p className="py-2 text-sm font-semibold text-slate-500">
                                  No allowances.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                            <div className="border-b border-slate-200 px-4 py-3">
                              <h3 className="text-sm font-extrabold text-slate-900">
                                Deductions
                              </h3>
                            </div>

                            <div className="space-y-2 p-4">
                              {normalizeEntries(deductions).length ? (
                                normalizeEntries(deductions).map(
                                  ([name, amount]) => (
                                    <AmountRow
                                      key={name}
                                      name={name}
                                      amount={amount}
                                    />
                                  ),
                                )
                              ) : (
                                <p className="py-2 text-sm font-semibold text-slate-500">
                                  No deductions.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#FF5800] px-5 text-sm font-extrabold text-white shadow-lg hover:bg-[#e94f00]"
                      >
                        <FaDownload />
                        Download Payslip
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
