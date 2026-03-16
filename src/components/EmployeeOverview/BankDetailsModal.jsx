import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  MdAccountBalance,
  MdClose,
  MdDeleteOutline,
  MdOutlineSave,
} from "react-icons/md";

import {
  fetchBankDetailById,
  createBankDetailThunk,
  updateBankDetailThunk,
  deleteBankDetailThunk,
} from "../../redux/actions/bankActions";
import { bankReset, bankSetDetailId } from "../../redux/reducer/bankSlice";

const lsKey = (employeePk) => `bank_detail_id_${employeePk}`;

export default function BankDetailsModal({
  open,
  onClose,
  employeePk,
  employeeCode,
}) {
  const dispatch = useDispatch();

  const { detail, detailId, loading, saving, deleting, error } = useSelector(
    (s) => s.bank || {},
  );

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");

  const activeDetailId = useMemo(
    () => detailId ?? detail?.id ?? null,
    [detailId, detail],
  );

  const isEdit = !!activeDetailId;

  const fillForm = (bankDetail) => {
    setBankName(bankDetail?.bank_name ?? "");
    setAccountNumber(bankDetail?.account_number ?? "");
    setIfscCode(bankDetail?.ifsc_code ?? "");
    setBranchName(bankDetail?.branch_name ?? "");
  };

  const clearForm = () => {
    setBankName("");
    setAccountNumber("");
    setIfscCode("");
    setBranchName("");
  };

  useEffect(() => {
    if (!open) return;

    if (!employeePk || !Number.isFinite(Number(employeePk))) {
      toast.error(
        "employeePk (DB id) missing. Bank API needs numeric employee id.",
      );
      return;
    }

    const stored = localStorage.getItem(lsKey(employeePk));
    const storedId = stored ? Number(stored) : null;

    dispatch(bankReset());

    if (storedId && Number.isFinite(storedId)) {
      dispatch(bankSetDetailId(storedId));
      dispatch(fetchBankDetailById({ detailId: storedId }));
    } else {
      clearForm();
    }
  }, [open, employeePk, dispatch]);

  useEffect(() => {
    if (detail) fillForm(detail);
  }, [detail]);

  useEffect(() => {
    if (error) toast.error(String(error));
  }, [error]);

  const validate = () => {
    if (!bankName.trim()) return "Bank name required";
    if (!accountNumber.trim()) return "Account number required";
    if (!ifscCode.trim()) return "IFSC code required";
    if (!branchName.trim()) return "Branch name required";
    return "";
  };

  const onSave = async () => {
    const msg = validate();
    if (msg) {
      toast.error(msg);
      return;
    }

    if (!employeePk || !Number.isFinite(Number(employeePk))) {
      toast.error("employeePk missing");
      return;
    }

    if (activeDetailId) {
      const res = await dispatch(
        updateBankDetailThunk({
          detailId: activeDetailId,
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          ifsc_code: ifscCode.trim(),
          branch_name: branchName.trim(),
        }),
      );

      if (res.meta.requestStatus === "fulfilled") {
        const updated = res.payload;

        if (updated?.id) {
          dispatch(bankSetDetailId(updated.id));
          localStorage.setItem(lsKey(employeePk), String(updated.id));
        }

        fillForm({
          bank_name: updated?.bank_name ?? bankName.trim(),
          account_number: updated?.account_number ?? accountNumber.trim(),
          ifsc_code: updated?.ifsc_code ?? ifscCode.trim(),
          branch_name: updated?.branch_name ?? branchName.trim(),
        });

        toast.success("Bank details updated");
      }
      return;
    }

    const res = await dispatch(
      createBankDetailThunk({
        employeePk: Number(employeePk),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim(),
        branch_name: branchName.trim(),
      }),
    );

    if (res.meta.requestStatus === "fulfilled") {
      const created = res.payload;
      const newId = created?.id ?? null;

      if (newId) {
        dispatch(bankSetDetailId(newId));
        localStorage.setItem(lsKey(employeePk), String(newId));
      }

      fillForm({
        bank_name: created?.bank_name ?? bankName.trim(),
        account_number: created?.account_number ?? accountNumber.trim(),
        ifsc_code: created?.ifsc_code ?? ifscCode.trim(),
        branch_name: created?.branch_name ?? branchName.trim(),
      });

      toast.success("Bank details saved");
    }
  };

  const onDelete = async () => {
    if (!activeDetailId) return;

    const ok = window.confirm("Delete bank details?");
    if (!ok) return;

    const res = await dispatch(
      deleteBankDetailThunk({ detailId: activeDetailId }),
    );

    if (res.meta.requestStatus === "fulfilled") {
      localStorage.removeItem(lsKey(employeePk));
      dispatch(bankReset());
      clearForm();
      toast.success("Deleted");
      onClose?.();
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[2px]">
      <div className="flex min-h-screen items-center justify-center px-2 py-2 sm:px-4 sm:py-4">
        <div className="w-full max-w-[900px] rounded-[18px] sm:rounded-[24px] bg-white border border-[#e9edf3] shadow-[0_20px_60px_rgba(15,23,42,0.16)] overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-3 py-3 sm:px-6 sm:py-5 border-b border-[#edf1f6]">
            <div className="flex items-start gap-2.5 sm:gap-4 min-w-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-[#ffd9c7] bg-[#fff4ed] flex items-center justify-center shrink-0">
                <MdAccountBalance className="text-[18px] sm:text-[22px] text-[#ff5a00]" />
              </div>

              <div className="min-w-0">
                <h2 className="text-[18px] sm:text-[22px] leading-[1.1] font-bold text-[#172647]">
                  Bank Details
                </h2>

                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1.5 sm:gap-2">
                  <div className="text-[11px] sm:text-[13px] leading-4 sm:leading-5 text-[#74819a] break-all">
                    Employee:
                    <span className="ml-1 font-semibold text-[#1f2b46]">
                      {employeeCode ?? "—"}
                    </span>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] leading-none font-semibold border ${
                      isEdit
                        ? "bg-[#fff7e8] text-[#9a6700] border-[#ffe2aa]"
                        : "bg-[#eefaf1] text-[#1f8a46] border-[#cdeed7]"
                    }`}
                  >
                    {isEdit ? "Edit Mode" : "Create Mode"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-[#667085] hover:bg-[#f4f7fb] transition shrink-0"
            >
              <MdClose className="text-[20px] sm:text-[24px]" />
            </button>
          </div>

          {/* Body */}
          <div className="px-3 py-3 sm:px-6 sm:py-5">
            {loading ? (
              <div className="mb-3 sm:mb-5 rounded-xl border border-[#dbe7ff] bg-[#f5f9ff] px-3 py-2 text-[11px] sm:text-[13px] font-medium text-[#285ea8]">
                Fetching bank details...
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3 sm:gap-y-4">
              <Field label="Bank Name">
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                  disabled={saving || deleting}
                  className="w-full h-[42px] sm:h-[50px] rounded-[12px] sm:rounded-[16px] border border-[#dbe2eb] bg-[#fbfcfe] px-3 sm:px-4 text-[12px] sm:text-[14px] text-[#172647] placeholder:text-[#9aa6b8] outline-none transition focus:border-[#ffbf97] focus:ring-2 sm:focus:ring-4 focus:ring-[#fff1e8]"
                />
              </Field>

              <Field label="Account Number">
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  disabled={saving || deleting}
                  className="w-full h-[42px] sm:h-[50px] rounded-[12px] sm:rounded-[16px] border border-[#dbe2eb] bg-[#fbfcfe] px-3 sm:px-4 text-[12px] sm:text-[14px] text-[#172647] placeholder:text-[#9aa6b8] outline-none transition focus:border-[#ffbf97] focus:ring-2 sm:focus:ring-4 focus:ring-[#fff1e8]"
                />
              </Field>

              <Field label="IFSC Code">
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="Enter IFSC code"
                  disabled={saving || deleting}
                  className="w-full h-[42px] sm:h-[50px] rounded-[12px] sm:rounded-[16px] border border-[#dbe2eb] bg-[#fbfcfe] px-3 sm:px-4 text-[12px] sm:text-[14px] text-[#172647] placeholder:text-[#9aa6b8] outline-none transition focus:border-[#ffbf97] focus:ring-2 sm:focus:ring-4 focus:ring-[#fff1e8]"
                />
              </Field>

              <Field label="Branch Name">
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Enter branch name"
                  disabled={saving || deleting}
                  className="w-full h-[42px] sm:h-[50px] rounded-[12px] sm:rounded-[16px] border border-[#dbe2eb] bg-[#fbfcfe] px-3 sm:px-4 text-[12px] sm:text-[14px] text-[#172647] placeholder:text-[#9aa6b8] outline-none transition focus:border-[#ffbf97] focus:ring-2 sm:focus:ring-4 focus:ring-[#fff1e8]"
                />
              </Field>
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 py-3 sm:px-6 sm:py-4 border-t border-[#edf1f6] bg-[#fffefe]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-[11px] sm:text-[13px] leading-4 sm:leading-5 text-[#8a96ab]">
                {isEdit
                  ? "Existing bank detail available. You can update or delete it."
                  : "No bank detail found. Add new bank details for this employee."}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                {isEdit ? (
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={saving || deleting}
                    className="h-10 sm:h-11 min-w-[110px] rounded-[12px] sm:rounded-[16px] border border-[#ffd7d7] bg-[#fff5f5] px-3 sm:px-4 text-[12px] sm:text-[14px] font-semibold text-[#e53935] inline-flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-[#ffeaea] transition disabled:opacity-60"
                  >
                    <MdDeleteOutline className="text-[16px] sm:text-[18px]" />
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving || deleting}
                  className={`h-10 sm:h-11 min-w-[120px] rounded-[12px] sm:rounded-[16px] px-3 sm:px-4 text-[12px] sm:text-[14px] font-semibold text-white inline-flex items-center justify-center gap-1.5 sm:gap-2 transition disabled:opacity-60 ${
                    isEdit
                      ? "bg-[#f5a623] hover:bg-[#df941c]"
                      : "bg-[#ff5a00] hover:bg-[#e85000]"
                  }`}
                >
                  <MdOutlineSave className="text-[16px] sm:text-[18px]" />
                  {saving
                    ? isEdit
                      ? "Updating..."
                      : "Saving..."
                    : isEdit
                      ? "Update"
                      : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block mb-1.5 sm:mb-2 text-[12px] sm:text-[14px] leading-none font-semibold text-[#49566f]">
        {label}
      </label>
      {children}
    </div>
  );
}
