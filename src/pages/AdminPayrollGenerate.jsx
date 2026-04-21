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
      },
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
    bg = [245, 246, 248],
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
  doc.text(String(amountText || "—"), x + w / 2, y + h - 2.8, {
    align: "center",
  });
}

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
  const totalDays = getDaysInMonth(monthStart);

  const perDayAmount = getPerDayAmount(detail, monthStart);
  const presentAmount = getPresentAmount(detail, monthStart);
  const weekendAmount = getWeekendAmount(detail, monthStart);
  const holidayAmount = getHolidayAmount(detail, monthStart);
  const netSalary = getNet(detail);

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

  const slipMonth = monthStart
    ? new Date(monthStart)
        .toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        })
        .toUpperCase()
    : "-";

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
    // ignore image error
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
    {
      bg: [244, 244, 244],
      countColor: [27, 58, 110],
      amountColor: [0, 102, 255],
    },
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
    {
      bg: [244, 244, 244],
      countColor: [27, 58, 110],
      amountColor: [0, 102, 255],
    },
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
    {
      bg: [244, 244, 244],
      countColor: [27, 58, 110],
      amountColor: [0, 102, 255],
    },
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
      bg: [244, 244, 244],
      countColor: [27, 58, 110],
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
      bg: [244, 244, 244],
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
    {
      bg: [244, 244, 244],
      countColor: [27, 58, 110],
      amountColor: [0, 102, 255],
    },
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

    const result = await dispatch(fetchPayrollListThunk({ monthStart }));
    setHasLoadedOnce(true);

    if (fetchPayrollListThunk.fulfilled.match(result)) {
      const apiRows = result.payload?.data || [];

      const rowsWithNames = await Promise.all(
        apiRows.map(async (row) => {
          const empCode = getEmployeeCode(row);
          const fetchedName = await fetchEmployeeNameById(empCode);
          return { ...row, employee_name: fetchedName };
        }),
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
      fetchEmployeePayrollDetailThunk({ employeeId, monthStart }),
    );

    if (fetchEmployeePayrollDetailThunk.rejected.match(result)) {
      setDetailNotice(
        "Detailed employee API failed. Showing available summary data.",
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
