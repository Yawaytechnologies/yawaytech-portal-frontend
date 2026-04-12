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
  adminBankClearError,
  selectAdminBankItems,
  selectAdminBankLoading,
  selectAdminBankSaving,
  selectAdminBankDeleting,
  selectAdminBankError,
} from "../redux/reducer/adminBankSlice";

/* ─────────────────────────────────────────────
   Shared toast config
───────────────────────────────────────────── */
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
  padding: "5px 10px",
  lineHeight: 1.2,
  borderRadius: "12px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  fontSize: "0.76rem",
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

/* ─────────────────────────────────────────────
   Atom components
───────────────────────────────────────────── */
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
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${cls}`}
    >
      {children}
    </span>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-xs font-extrabold text-[#0e1b34] sm:text-sm">
          {label}
        </div>
        {hint && (
          <div className="text-[10px] text-[#0e1b34]/70 sm:text-xs">{hint}</div>
        )}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Btn({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-extrabold transition sm:gap-2 sm:px-4 sm:py-2 sm:text-xs 2xl:text-sm ${className}`}
    />
  );
}

const INPUT =
  "h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-[#0e1b34] placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-10 sm:px-3.5 sm:text-sm 2xl:h-11";

/* ─────────────────────────────────────────────
   BankModal
───────────────────────────────────────────── */
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
  pfNumber,
  setPfNumber,
  uanNumber,
  setUanNumber,
  saving,
  onSave,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/45 backdrop-blur-[1px] sm:items-center sm:p-4 xl:p-6">
      <div
        className="flex w-full flex-col overflow-hidden rounded-t-2xl border border-white/40 bg-white shadow-2xl sm:max-w-[560px] sm:rounded-[24px] md:max-w-[640px] xl:max-w-[720px]"
        style={{ maxHeight: "calc(100dvh - 0px)", minHeight: 0 }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#0e1b34] to-[#1d3b8b] px-4 py-3 text-white sm:px-5 sm:py-4 xl:px-6">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/90 sm:text-xs">
              Bank Management
            </div>
            <h2 className="mt-0.5 text-sm font-extrabold sm:mt-1 sm:text-lg xl:text-xl">
              {isEdit ? `Edit Bank · ${employeeId}` : "Add Bank Details"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:h-9 sm:w-9"
          >
            <MdClose className="text-base sm:text-lg" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 xl:p-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Employee ID">
                <input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. YTPL503IT"
                  disabled={isEdit}
                  className={`${INPUT} ${
                    isEdit ? "cursor-not-allowed opacity-60" : ""
                  }`}
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

            <Field label="PF Number">
              <input
                value={pfNumber}
                onChange={(e) => setPfNumber(e.target.value)}
                placeholder="e.g. PF123456789"
                disabled={saving}
                className={INPUT}
              />
            </Field>

            <Field label="UAN Number">
              <input
                value={uanNumber}
                onChange={(e) => setUanNumber(e.target.value)}
                placeholder="e.g. 100123456789"
                disabled={saving}
                className={INPUT}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2.5 sm:mt-5 sm:flex-row sm:justify-end sm:gap-3">
            <Btn
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`h-9 w-full text-white sm:h-10 sm:w-auto sm:min-w-[140px] ${
                saving
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-[#FF5800] hover:bg-[#ff6a1a]"
              }`}
            >
              <MdSave className="text-sm sm:text-base" />
              {saving ? "Saving…" : isEdit ? "Update Bank" : "Save Bank"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
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
  const [pfNumber, setPfNumber] = useState("");
  const [uanNumber, setUanNumber] = useState("");
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
          .includes(q) ||
        String(r?.pf_number || "")
          .toLowerCase()
          .includes(q) ||
        String(r?.uan_number || "")
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
    setPfNumber("");
    setUanNumber("");
    setIsEdit(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    clearForm();
    dispatch(adminBankClearError());
  };

  const openCreate = () => {
    clearForm();
    dispatch(adminBankClearError());
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setIsEdit(true);
    setEmployeeId(r.employee_id ?? "");
    setBankName(r.bank_name ?? "");
    setAccountNumber(r.account_number ?? "");
    setIfscCode(r.ifsc_code ?? "");
    setBranchName(r.branch_name ?? "");
    setPfNumber(r.pf_number ?? "");
    setUanNumber(r.uan_number ?? "");
    dispatch(adminBankClearError());
    setModalOpen(true);
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
      toast(
        "Bank Name, Account Number, IFSC Code and Branch Name are required",
        {
          ...TOAST_BASE,
          style: STYLE_ERR,
          icon: false,
        },
      );
      return;
    }

    const payload = {
      employee_id: employeeId.trim(),
      bank_name: bankName.trim(),
      account_number: accountNumber.trim(),
      ifsc_code: ifscCode.trim(),
      branch_name: branchName.trim(),
      pf_number: pfNumber.trim(),
      uan_number: uanNumber.trim(),
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
        adminUpdateBankDetail({
          employeeId: employeeId.trim(),
          payload,
        }),
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
      <div className="mx-auto w-full max-w-[1920px] px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 2xl:px-10 2xl:py-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:rounded-[24px]">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-gray-200 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between xl:px-6">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0e1b34]/55 sm:text-[11px]">
                Admin
              </div>
              <h1 className="mt-0.5 text-lg font-extrabold sm:mt-1 sm:text-2xl xl:text-3xl">
                Bank Details Management
              </h1>
              <div className="mt-1.5 flex flex-wrap gap-2 sm:mt-2">
                <Chip tone="orange">{loading ? "Loading…" : "Ready"}</Chip>
                <Chip tone="dark">{filtered.length} record(s)</Chip>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Btn
                type="button"
                onClick={onRefresh}
                className="h-9 border border-gray-200 bg-white hover:bg-gray-50 sm:h-10"
              >
                <MdRefresh className="text-[#FF5800]" />
              </Btn>

              <Btn
                type="button"
                onClick={openCreate}
                className="h-9 bg-[#4f46e5] text-white hover:bg-[#4338ca] sm:h-10"
              >
                <MdAdd className="text-sm sm:text-base" />
                Add Bank Details
              </Btn>
            </div>
          </div>

          {/* Filter bar */}
          <div className="border-b border-gray-200 bg-[#f8fafc] px-3 py-3 sm:px-5 sm:py-4 xl:px-6">
            <input
              value={filterEmpId}
              onChange={(e) => setFilterEmpId(e.target.value)}
              placeholder="Search by Employee ID, Bank Name, PF Number or UAN Number"
              className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20 sm:h-10 sm:max-w-sm sm:px-4 sm:text-sm"
            />
          </div>

          {/* Content area */}
          <div className="p-3 sm:p-4 xl:p-5">
            {loading && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-700">
                Loading bank records…
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f8fafc] px-4 py-10 text-center text-sm text-[#0e1b34]/60">
                No bank records found. Click <strong>Refresh</strong> or{" "}
                <strong>Add Bank Details</strong>.
              </div>
            )}

            {/* Mobile card list */}
            {!loading && filtered.length > 0 && (
              <div className="space-y-3 sm:hidden">
                {filtered.map((r) => (
                  <div
                    key={r.employee_id}
                    className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-extrabold text-[#0e1b34]">
                          {r.employee_id}
                        </div>
                        <div className="mt-0.5 truncate text-[10px] text-[#0e1b34]/60">
                          {r.bank_name || "—"}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white transition hover:bg-gray-50"
                        >
                          <MdEdit className="text-sm text-[#FF5800]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(r.employee_id)}
                          disabled={deleting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-red-200 bg-white transition hover:bg-red-50 disabled:opacity-60"
                        >
                          <MdDeleteOutline className="text-sm text-[#991B1B]" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <div className="rounded-xl border border-gray-100 bg-[#f8fafc] px-2.5 py-2">
                        <div className="text-[9px] font-semibold uppercase tracking-wide text-[#0e1b34]/50">
                          Account No
                        </div>
                        <div className="mt-0.5 break-all text-[10px] font-mono font-bold text-[#0e1b34]">
                          {r.account_number || "—"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-[#f8fafc] px-2.5 py-2">
                        <div className="text-[9px] font-semibold uppercase tracking-wide text-[#0e1b34]/50">
                          IFSC
                        </div>
                        <div className="mt-0.5 text-[10px] font-mono font-bold text-[#0e1b34]">
                          {r.ifsc_code || "—"}
                        </div>
                      </div>

                      <div className="col-span-2 rounded-xl border border-gray-100 bg-[#f8fafc] px-2.5 py-2">
                        <div className="text-[9px] font-semibold uppercase tracking-wide text-[#0e1b34]/50">
                          Branch
                        </div>
                        <div className="mt-0.5 text-[10px] font-bold text-[#0e1b34]">
                          {r.branch_name || "—"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-[#f8fafc] px-2.5 py-2">
                        <div className="text-[9px] font-semibold uppercase tracking-wide text-[#0e1b34]/50">
                          PF Number
                        </div>
                        <div className="mt-0.5 break-all text-[10px] font-bold text-[#0e1b34]">
                          {r.pf_number || "—"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-[#f8fafc] px-2.5 py-2">
                        <div className="text-[9px] font-semibold uppercase tracking-wide text-[#0e1b34]/50">
                          UAN Number
                        </div>
                        <div className="mt-0.5 break-all text-[10px] font-bold text-[#0e1b34]">
                          {r.uan_number || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Desktop table */}
            {!loading && filtered.length > 0 && (
              <div className="hidden overflow-auto rounded-2xl border border-gray-200 bg-white sm:block sm:rounded-[22px]">
                <table className="min-w-[900px] w-full text-xs sm:text-sm">
                  <thead className="bg-[#f8fafc]">
                    <tr className="border-b border-gray-200 text-left">
                      {[
                        "Employee ID",
                        "Bank Name",
                        "Account Number",
                        "IFSC Code",
                        "Branch",
                        "PF Number",
                        "UAN Number",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wide text-[#0e1b34]/65 sm:px-4 sm:py-3 sm:text-[11px]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((r) => (
                      <tr
                        key={r.employee_id}
                        className="border-b border-gray-100 hover:bg-[#0e1b34]/[0.02]"
                      >
                        <td className="px-3 py-3 font-extrabold sm:px-4 sm:py-4">
                          {r.employee_id}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4">
                          {r.bank_name || "—"}
                        </td>
                        <td className="px-3 py-3 font-mono sm:px-4 sm:py-4">
                          {r.account_number || "—"}
                        </td>
                        <td className="px-3 py-3 font-mono sm:px-4 sm:py-4">
                          {r.ifsc_code || "—"}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4">
                          {r.branch_name || "—"}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4">
                          {r.pf_number || "—"}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4">
                          {r.uan_number || "—"}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4">
                          <div className="flex gap-2">
                            <Btn
                              type="button"
                              onClick={() => openEdit(r)}
                              className="border border-gray-200 bg-white hover:bg-gray-50"
                            >
                              <MdEdit className="text-sm text-[#FF5800] sm:text-base" />
                            </Btn>

                            <Btn
                              type="button"
                              onClick={() => onDelete(r.employee_id)}
                              disabled={deleting}
                              className="border border-red-200 bg-white text-[#991B1B] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <MdDeleteOutline className="text-sm sm:text-base" />
                            </Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal via portal */}
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
            pfNumber={pfNumber}
            setPfNumber={setPfNumber}
            uanNumber={uanNumber}
            setUanNumber={setUanNumber}
            saving={saving}
            onSave={onSave}
          />,
          document.body,
        )}
    </div>
  );
}
