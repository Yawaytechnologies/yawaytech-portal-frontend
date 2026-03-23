// src/pages/AdminBankDetails.jsx
import React, { useEffect, useState, useMemo } from "react";
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

/* ── toast styles (matches AdminSalaries) ── */
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

/* ── shared atoms (identical to AdminSalaries) ── */
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

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-xs font-extrabold text-[#0e1b34]/80">{label}</div>
        {hint && <div className="text-[11px] text-[#0e1b34]/55">{hint}</div>}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Btn({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold transition ${className}`}
    />
  );
}

const INPUT =
  "h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20";

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/40 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#0e1b34] to-[#1d3b8b] px-5 py-4 text-white">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70">
              Bank Management
            </div>
            <h2 className="mt-1 text-xl font-extrabold">
              {isEdit ? `Edit Bank · ${employeeId}` : "Add Bank Details"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[85vh] overflow-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Employee ID" hint="employee code e.g. YTPL503IT">
                <input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. YTPL503IT"
                  disabled={isEdit}
                  className={`${INPUT} ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </Field>
            </div>

            <Field label="Bank Name" hint="bank_name">
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank"
                disabled={saving}
                className={INPUT}
              />
            </Field>

            <Field label="Account Number" hint="account_number">
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 5043216789056"
                disabled={saving}
                className={INPUT}
              />
            </Field>

            <Field label="IFSC Code" hint="ifsc_code">
              <input
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
                disabled={saving}
                className={INPUT}
              />
            </Field>

            <Field label="Branch Name" hint="branch_name">
              <input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Chennai Anna Nagar"
                disabled={saving}
                className={INPUT}
              />
            </Field>
          </div>

          <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs font-semibold text-[#8a3f00]">
            Bank API uses employee code (e.g.{" "}
            <span className="font-extrabold">YTPL503IT</span>), not numeric ID.
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Btn
              type="button"
              onClick={onClose}
              className="h-11 border border-gray-200 bg-white text-[#0e1b34] hover:bg-gray-50"
            >
              Cancel
            </Btn>
            <Btn
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`h-11 min-w-[170px] text-white ${saving ? "cursor-not-allowed bg-gray-300" : "bg-[#FF5800] hover:bg-[#ff6a1a]"}`}
            >
              <MdSave className="text-lg" />
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

  /* load all on mount */
  useEffect(() => {
    dispatch(adminListBankDetails());
  }, [dispatch]);

  /* error toasts */
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

  /* helpers */
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

  /* FETCH single by employee_id */
  const onFetch = async () => {
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

  /* REFRESH list */
  const onRefresh = () => {
    dispatch(adminListBankDetails());
  };

  /* SAVE */
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

  /* DELETE */
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
    <div className="min-h-screen bg-[#f4f6fa] text-[#0e1b34]">
      <div className="mx-auto w-full max-w-[98%] 2xl:max-w-[1600px] px-2 py-4 sm:px-4 lg:px-6">
        <div className="rounded-[28px] border border-gray-200 bg-white shadow-sm">
          {/* ── Header ── */}
          <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0e1b34]/55">
                Admin
              </div>
              <h1 className="mt-1 text-2xl font-extrabold">
                Bank Details Management
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <Chip tone="orange">{loading ? "Loading..." : "Ready"}</Chip>
                <Chip tone="dark">{filtered.length} record(s)</Chip>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Btn
                type="button"
                onClick={onRefresh}
                className="h-11 border border-gray-200 bg-white hover:bg-gray-50"
              >
                <MdRefresh className="text-[#FF5800]" />
                Refresh
              </Btn>
              <Btn
                type="button"
                onClick={openCreate}
                className="h-11 bg-[#4f46e5] text-white hover:bg-[#4338ca]"
              >
                <MdAdd className="text-lg" />
                Add Bank Details
              </Btn>
            </div>
          </div>

          {/* ── Filter bar ── */}
          <div className="border-b border-gray-200 bg-[#f8fafc] px-4 py-4 sm:px-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                value={filterEmpId}
                onChange={(e) => setFilterEmpId(e.target.value)}
                placeholder="Employee ID (e.g. YTPL503IT)"
                className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm placeholder:text-[#0e1b34]/40 outline-none focus:border-[#FF5800] focus:ring-2 focus:ring-[#FF5800]/20"
              />
              <Btn
                type="button"
                onClick={onFetch}
                disabled={loading}
                className="h-11 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60"
              >
                <MdRefresh className="text-[#FF5800]" />
                {loading ? "Fetching..." : "Fetch by ID"}
              </Btn>
              <div className="flex items-center rounded-2xl border border-orange-100 bg-orange-50 px-4 text-xs font-semibold text-[#8a3f00]">
                Enter employee code, not numeric ID.
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="p-4 sm:p-5">
            <div className="overflow-auto rounded-[24px] border border-gray-200 bg-white">
              <table className="min-w-[900px] w-full text-sm">
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
                        className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#0e1b34]/65"
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
                        className="px-4 py-12 text-center text-[#0e1b34]/70"
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
                        <td className="px-4 py-4 font-extrabold">
                          {r.employee_id}
                        </td>
                        <td className="px-4 py-4">{r.bank_name || "—"}</td>
                        <td className="px-4 py-4 font-mono">
                          {r.account_number || "—"}
                        </td>
                        <td className="px-4 py-4 font-mono">
                          {r.ifsc_code || "—"}
                        </td>
                        <td className="px-4 py-4">{r.branch_name || "—"}</td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <Btn
                              type="button"
                              onClick={() => openEdit(r)}
                              className="border border-gray-200 bg-white hover:bg-gray-50"
                            >
                              <MdEdit className="text-lg text-[#FF5800]" />
                              Edit
                            </Btn>
                            <Btn
                              type="button"
                              onClick={() => onDelete(r.employee_id)}
                              disabled={deleting}
                              className="border border-red-200 bg-white text-[#991B1B] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <MdDeleteOutline className="text-lg" />
                              Delete
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
      />
    </div>
  );
}
