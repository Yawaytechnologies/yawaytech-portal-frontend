// src/pages/AdminBankDetails.jsx
import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  MdRefresh,
  MdSave,
  MdEdit,
  MdDeleteOutline,
  MdAdd,
  MdClose,
} from "react-icons/md";
import { toast, Slide } from "react-toastify";

import {
  adminListBankDetails,
  adminFetchBankDetail,
  adminCreateBankDetail,
  adminUpdateBankDetail,
  adminDeleteBankDetail,
} from "../redux/actions/adminBankActions";
import {
  adminBankReset,
  adminBankClearError,
  selectAdminBankItems,
  selectAdminBankLoading,
  selectAdminBankSaving,
  selectAdminBankDeleting,
  selectAdminBankError,
} from "../redux/reducer/adminBankSlice";

const TOAST_BASE = {
  position: "top-center",
  transition: Slide,
  autoClose: 1800,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
};
const PILL = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "auto",
  maxWidth: "min(82vw,360px)",
  padding: "6px 10px",
  lineHeight: 1.2,
  borderRadius: "12px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  fontSize: "0.82rem",
  fontWeight: 800,
};
const STYLE_OK = {
  ...PILL,
  background: "#ECFDF5",
  color: "#065F46",
  border: "1px solid #A7F3D0",
};
const STYLE_ERR = {
  ...PILL,
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
};

/* ── atoms ── */
function Chip({ children, tone = "neutral" }) {
  const cls =
    tone === "orange"
      ? "border-orange-200 bg-orange-50 text-[#FF5800]"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "red"
          ? "border-red-200 bg-red-50 text-red-700"
          : tone === "dark"
            ? "border-[#0e1b34]/15 bg-[#0e1b34]/[0.04] text-[#0e1b34]"
            : "border-gray-200 bg-white text-[#0e1b34]";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${cls}`}
    >
      {children}
    </span>
  );
}

/* CHANGED: label text-sm→base→lg; hint text-xs→sm */
function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-sm font-extrabold text-[#0e1b34] sm:text-base 2xl:text-lg">
          {label}
        </div>
        {hint && (
          <div className="text-xs text-[#0e1b34]/70 sm:text-sm 2xl:text-base">
            {hint}
          </div>
        )}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/* CHANGED: px/text/gap scale */
function Btn({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition sm:gap-2 sm:px-4 sm:py-2 sm:text-sm 2xl:px-5 2xl:text-base ${className}`}
    />
  );
}

/* CHANGED: input h-10→h-12; px-3→px-4; text-sm→base */
const INPUT =
  "h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-[#0e1b34] placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-12 sm:px-4 2xl:h-13 2xl:text-base";

/* ── Modal ── */
function BankModal({
  open,
  onClose,
  isEdit,
  employeeId,
  setEmployeeId,
  bankName,
  setBankName,
  accountNumber,
  setAccountNumber,
  ifscCode,
  setIfscCode,
  branchName,
  setBranchName,
  saving,
  onSave,
}) {
  if (!open) return null;
  return (
    /* CHANGED: overlay p-2→p-4; z-99999 */
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/45 p-2 backdrop-blur-[1px] sm:p-4 xl:p-6 2xl:p-8">
      {/* CHANGED: flex-col, max-w scales, max-h cap */}
      <div
        className="flex w-full max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-2xl border border-white/40 bg-white shadow-2xl sm:max-w-[560px] sm:rounded-[28px] md:max-w-[660px] xl:max-w-[760px] 2xl:max-w-[860px]"
        style={{ maxHeight: "calc(100dvh - 16px)" }}
      >
        {/* CHANGED: shrink-0 header; px/py scale */}
        <div className="shrink-0 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#0e1b34] to-[#1d3b8b] px-3 py-3 text-white sm:px-5 sm:py-4 xl:px-7 2xl:px-8">
          <div>
            {/* CHANGED: sub-label text-xs→sm */}
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/90 sm:text-sm 2xl:text-base">
              Bank Management
            </div>
            {/* CHANGED: title text-base→xl */}
            <h2 className="mt-0.5 text-base font-extrabold sm:mt-1 sm:text-xl 2xl:text-2xl">
              {isEdit ? `Edit Bank · ${employeeId}` : "Add Bank Details"}
            </h2>
          </div>
          {/* CHANGED: close btn h-8→h-10 */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:h-10 sm:w-10 2xl:h-11 2xl:w-11"
          >
            <MdClose className="text-base sm:text-xl 2xl:text-2xl" />
          </button>
        </div>

        {/* CHANGED: flex-1 overflow-y-auto; p-3→p-5 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 xl:p-6 2xl:p-8">
          {/* CHANGED: gap-3→gap-4 */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 2xl:gap-5">
            <div className="md:col-span-2">
              <Field label="Employee ID">
                <input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. YTPL503IT"
                  disabled={isEdit}
                  className={`${INPUT} ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </Field>
            </div>

            <Field label="Bank Name">
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank"
                disabled={saving}
                className={INPUT}
              />
            </Field>

            <Field label="Account Number">
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 5043216789056"
                disabled={saving}
                className={INPUT}
              />
            </Field>

            <Field label="IFSC Code">
              <input
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
                disabled={saving}
                className={INPUT}
              />
            </Field>

            <Field label="Branch Name">
              <input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Chennai Anna Nagar"
                disabled={saving}
                className={INPUT}
              />
            </Field>
          </div>

          {/* CHANGED: footer col-reverse mobile → row sm */}
          <div className="mt-4 flex flex-col-reverse gap-2.5 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3 2xl:gap-4">
            <Btn
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`h-10 w-full text-white sm:h-11 sm:w-auto sm:min-w-[150px] 2xl:h-12 2xl:min-w-[180px] ${saving ? "cursor-not-allowed bg-gray-300" : "bg-[#FF5800] hover:bg-[#ff6a1a]"}`}
            >
              <MdSave className="text-base sm:text-lg" />
              {saving ? "Saving..." : isEdit ? "Update Bank" : "Save Bank"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function AdminBankDetails() {
  const dispatch = useDispatch();

  const items = useSelector(selectAdminBankItems);
  const loading = useSelector(selectAdminBankLoading);
  const saving = useSelector(selectAdminBankSaving);
  const deleting = useSelector(selectAdminBankDeleting);
  const error = useSelector(selectAdminBankError);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [filterEmpId, setFilterEmpId] = useState("");

  useEffect(() => {
    dispatch(adminListBankDetails());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast(String(error), { ...TOAST_BASE, style: STYLE_ERR, icon: false });
      dispatch(adminBankClearError());
    }
  }, [error, dispatch]);

  const filtered = useMemo(() => {
    const q = filterEmpId.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        String(r?.employee_id || "")
          .toLowerCase()
          .includes(q) ||
        String(r?.bank_name || "")
          .toLowerCase()
          .includes(q),
    );
  }, [items, filterEmpId]);

  const clearForm = () => {
    setEmployeeId("");
    setBankName("");
    setAccountNumber("");
    setIfscCode("");
    setBranchName("");
    setIsEdit(false);
  };
  const closeModal = () => {
    setModalOpen(false);
    clearForm();
    dispatch(adminBankReset());
  };
  const openCreate = () => {
    clearForm();
    dispatch(adminBankReset());
    setModalOpen(true);
  };
  const openEdit = (r) => {
    setIsEdit(true);
    setEmployeeId(r.employee_id ?? "");
    setBankName(r.bank_name ?? "");
    setAccountNumber(r.account_number ?? "");
    setIfscCode(r.ifsc_code ?? "");
    setBranchName(r.branch_name ?? "");
    dispatch(adminBankReset());
    setModalOpen(true);
  };

  const _onFetch = async () => {
    const eid = filterEmpId.trim();
    if (!eid) {
      toast("Enter an employee ID to fetch", {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
      return;
    }
    const res = await dispatch(adminFetchBankDetail({ employeeId: eid }));
    if (adminFetchBankDetail.fulfilled.match(res)) {
      toast("Bank detail fetched", {
        ...TOAST_BASE,
        style: STYLE_OK,
        icon: false,
      });
    } else {
      toast(String(res.payload || "Not found"), {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
    }
  };

  const onRefresh = () => dispatch(adminListBankDetails());

  const onSave = async () => {
    if (!employeeId.trim()) {
      toast("Employee ID required", {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
      return;
    }
    if (
      !bankName.trim() ||
      !accountNumber.trim() ||
      !ifscCode.trim() ||
      !branchName.trim()
    ) {
      toast("All fields are required", {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
      return;
    }
    const payload = {
      employee_id: employeeId.trim(),
      bank_name: bankName.trim(),
      account_number: accountNumber.trim(),
      ifsc_code: ifscCode.trim(),
      branch_name: branchName.trim(),
    };

    if (!isEdit) {
      const res = await dispatch(adminCreateBankDetail({ payload }));
      if (adminCreateBankDetail.fulfilled.match(res)) {
        toast("Bank details saved", {
          ...TOAST_BASE,
          style: STYLE_OK,
          icon: false,
        });
        closeModal();
        dispatch(adminListBankDetails());
      } else {
        toast(String(res.payload || "Create failed"), {
          ...TOAST_BASE,
          style: STYLE_ERR,
          icon: false,
        });
      }
    } else {
      const res = await dispatch(
        adminUpdateBankDetail({ employeeId: employeeId.trim(), payload }),
      );
      if (adminUpdateBankDetail.fulfilled.match(res)) {
        toast("Bank details updated", {
          ...TOAST_BASE,
          style: STYLE_OK,
          icon: false,
        });
        closeModal();
        dispatch(adminListBankDetails());
      } else {
        toast(String(res.payload || "Update failed"), {
          ...TOAST_BASE,
          style: STYLE_ERR,
          icon: false,
        });
      }
    }
  };

  const onDelete = async (empId) => {
    if (!window.confirm(`Delete bank details for ${empId}?`)) return;
    const res = await dispatch(adminDeleteBankDetail({ employeeId: empId }));
    if (adminDeleteBankDetail.fulfilled.match(res)) {
      toast("Deleted", { ...TOAST_BASE, style: STYLE_OK, icon: false });
      dispatch(adminListBankDetails());
    } else {
      toast(String(res.payload || "Delete failed"), {
        ...TOAST_BASE,
        style: STYLE_ERR,
        icon: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0e1b34]">
      {/* CHANGED: py/px scale */}
      <div className="mx-auto w-full max-w-[98%] px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 2xl:max-w-[1600px] 2xl:px-8 2xl:py-6">
        {/* CHANGED: rounded-2xl on mobile → [28px] sm+ */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:rounded-[28px]">
          {/* ── Header ── */}
          {/* CHANGED: px/py/gap scale; flex-col → lg:flex-row */}
          <div className="flex flex-col gap-3 border-b border-gray-200 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between xl:px-6 2xl:px-8 2xl:py-5">
            <div>
              {/* CHANGED: admin label text scales */}
              <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0e1b34]/55 sm:text-[11px] 2xl:text-xs">
                Admin
              </div>
              {/* CHANGED: h1 text-xl→2xl→3xl→4xl */}
              <h1 className="mt-0.5 text-xl font-extrabold sm:mt-1 sm:text-2xl xl:text-3xl 2xl:text-4xl">
                Bank Details Management
              </h1>
              {/* CHANGED: chips mt scale */}
              <div className="mt-1.5 flex flex-wrap gap-2 sm:mt-2">
                <Chip tone="orange">{loading ? "Loading..." : "Ready"}</Chip>
                <Chip tone="dark">{filtered.length} record(s)</Chip>
              </div>
            </div>

            {/* CHANGED: button h-9→h-11 */}
            <div className="flex flex-wrap gap-2">
              <Btn
                type="button"
                onClick={onRefresh}
                className="h-9 border border-gray-200 bg-white hover:bg-gray-50 sm:h-11 2xl:h-12"
              >
                <MdRefresh className="text-[#FF5800]" />
              </Btn>
              <Btn
                type="button"
                onClick={openCreate}
                className="h-9 bg-[#4f46e5] text-white hover:bg-[#4338ca] sm:h-11 2xl:h-12"
              >
                <MdAdd className="text-base sm:text-lg" />
                Add Bank Details
              </Btn>
            </div>
          </div>

          {/* ── Filter bar ── */}
          {/* CHANGED: px/py scale */}
          <div className="border-b border-gray-200 bg-[#f8fafc] px-3 py-3 sm:px-5 sm:py-4 xl:px-6 2xl:px-8">
            <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-3">
              {/* CHANGED: h-9→h-11; px-3→px-4; text scales */}
              <input
                value={filterEmpId}
                onChange={(e) => setFilterEmpId(e.target.value)}
                placeholder="Employee ID (e.g. YTPL503IT)"
                className="h-9 rounded-2xl border border-gray-200 bg-white px-3 text-sm placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-11 sm:px-4 2xl:h-12 2xl:text-base"
              />
            </div>
          </div>

          {/* ── Table ── */}
          {/* CHANGED: p-3→p-4→p-5 */}
          <div className="p-3 sm:p-4 xl:p-5 2xl:p-6">
            <div className="overflow-auto rounded-2xl border border-gray-200 bg-white sm:rounded-[24px]">
              {/* CHANGED: min-w shrinks on mobile; text scales */}
              <table className="min-w-[600px] w-full text-sm 2xl:text-base">
                <thead className="bg-[#f8fafc]">
                  <tr className="border-b border-gray-200 text-left">
                    {[
                      "Employee ID",
                      "Bank Name",
                      "Account Number",
                      "IFSC Code",
                      "Branch",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-[#0e1b34]/65 sm:px-4 sm:py-3 2xl:px-5 2xl:text-sm"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && !loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-[#0e1b34]/70 2xl:text-base"
                      >
                        No bank records found. Click Refresh or Add Bank
                        Details.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr
                        key={r.employee_id}
                        className="border-b border-gray-100 hover:bg-[#0e1b34]/[0.02]"
                      >
                        {/* CHANGED: px-3 py-3 sm:px-4 sm:py-4 */}
                        <td className="px-3 py-3 font-extrabold sm:px-4 sm:py-4 2xl:px-5">
                          {r.employee_id}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4 2xl:px-5">
                          {r.bank_name || "—"}
                        </td>
                        <td className="px-3 py-3 font-mono sm:px-4 sm:py-4 2xl:px-5">
                          {r.account_number || "—"}
                        </td>
                        <td className="px-3 py-3 font-mono sm:px-4 sm:py-4 2xl:px-5">
                          {r.ifsc_code || "—"}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4 2xl:px-5">
                          {r.branch_name || "—"}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4 2xl:px-5">
                          <div className="flex gap-2">
                            <Btn
                              type="button"
                              onClick={() => openEdit(r)}
                              className="border border-gray-200 bg-white hover:bg-gray-50"
                            >
                              <MdEdit className="text-base text-[#FF5800] sm:text-lg" />
                            </Btn>
                            <Btn
                              type="button"
                              onClick={() => onDelete(r.employee_id)}
                              disabled={deleting}
                              className="border border-red-200 bg-white text-[#991B1B] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <MdDeleteOutline className="text-base sm:text-lg" />
                            </Btn>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {modalOpen &&
        createPortal(
          <BankModal
            open={modalOpen}
            onClose={closeModal}
            isEdit={isEdit}
            employeeId={employeeId}
            setEmployeeId={setEmployeeId}
            bankName={bankName}
            setBankName={setBankName}
            accountNumber={accountNumber}
            setAccountNumber={setAccountNumber}
            ifscCode={ifscCode}
            setIfscCode={setIfscCode}
            branchName={branchName}
            setBranchName={setBranchName}
            saving={saving}
            onSave={onSave}
          />,
          document.body,
        )}
    </div>
  );
}
