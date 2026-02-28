import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { MdAccountBalance, MdClose, MdDelete, MdSave } from "react-icons/md";

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

  useEffect(() => {
    if (!open) return;

    dispatch(bankReset());

    if (!employeePk || !Number.isFinite(Number(employeePk))) {
      toast.error(
        "employeePk (DB id) missing. Bank API needs numeric employee id.",
      );
      return;
    }

    const stored = localStorage.getItem(lsKey(employeePk));
    const storedId = stored ? Number(stored) : null;

    if (storedId && Number.isFinite(storedId)) {
      dispatch(bankSetDetailId(storedId));
      dispatch(fetchBankDetailById({ detailId: storedId }));
    } else {
      setBankName("");
      setAccountNumber("");
      setIfscCode("");
      setBranchName("");
    }
  }, [open, employeePk, dispatch]);

  useEffect(() => {
    if (!detail) return;
    setBankName(detail.bank_name ?? "");
    setAccountNumber(detail.account_number ?? "");
    setIfscCode(detail.ifsc_code ?? "");
    setBranchName(detail.branch_name ?? "");
  }, [detail]);

  useEffect(() => {
    if (error) toast.error(String(error));
  }, [error]);

  const validate = () => {
    if (!bankName.trim()) return "Bank name required";
    if (!accountNumber.trim()) return "Account number required";
    if (!ifscCode.trim()) return "IFSC required";
    if (!branchName.trim()) return "Branch name required";
    return "";
  };

  const onSave = async () => {
    const msg = validate();
    if (msg) return toast.error(msg);

    if (!employeePk || !Number.isFinite(Number(employeePk))) {
      return toast.error("employeePk missing");
    }

    // UPDATE
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
        toast.success("Bank details updated");
      }
      return;
    }

    // CREATE
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
        localStorage.setItem(lsKey(employeePk), String(newId));
        dispatch(bankSetDetailId(newId));
      }
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
      toast.success("Deleted");
      onClose?.();
    }
  };

  if (!open) return null;

  const mode = activeDetailId
    ? `edit mode (id: ${activeDetailId})`
    : "create mode";

  return createPortal(
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-black/50 backdrop-blur-sm px-3">
      <div className="w-full max-w-3xl max-h-[92vh] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-orange-50 border border-orange-200">
              <MdAccountBalance className="text-[#FF5800] text-xl" />
            </span>
            <div className="leading-tight">
              <div className="text-lg font-bold text-[#0e1b34]">Bank Details</div>
              <div className="text-xs text-gray-500">
                Employee: <span className="font-semibold">{employeeCode ?? "—"}</span>
               
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid place-items-center w-10 h-10 rounded-full hover:bg-gray-100"
            aria-label="Close"
            type="button"
          >
            <MdClose className="text-2xl text-gray-600" />
          </button>
        </div>

        {/* Body
            ✅ 768px+ : 2 columns (Bank+Account in row1, IFSC+Branch in row2)
            ✅ Mobile: 1 column
            ✅ Keep scroll ability but hide scrollbar (no-scrollbar)
        */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 py-3 sm:py-5">
          {loading ? (
            <div className="text-sm text-gray-600 mb-2">Loading...</div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <Field label="Bank Name">
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm text-[#0e1b34] bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                disabled={saving || deleting}
              />
            </Field>

            <Field label="Account Number">
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm text-[#0e1b34] bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                disabled={saving || deleting}
              />
            </Field>

            <Field label="IFSC Code">
              <input
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm text-[#0e1b34] bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                disabled={saving || deleting}
              />
            </Field>

            <Field label="Branch Name">
              <input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm text-[#0e1b34] bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                disabled={saving || deleting}
              />
            </Field>
          </div>
        </div>

        {/* Footer (mobile: single row buttons, no big gap) */}
        <div className="border-t bg-white px-4 sm:px-5 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            

            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving || deleting}
                className="sm:w-auto h-8 sm:h-10 px-3 sm:px-4 rounded-xl border border-[#0e1b34]
                           text-[#0e1b34] text-sm hover:bg-gray-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={onDelete}
                disabled={!activeDetailId || saving || deleting}
                className="sm:w-auto h-8 sm:h-10 px-3 sm:px-4 rounded-lg bg-red-50 border border-red-200
                           text-red-600 text-sm inline-flex items-center justify-center gap-2"
                title={!activeDetailId ? "Nothing to delete" : ""}
              >
                <MdDelete  />
                {deleting ? "Deleting..." : "Delete"}
              </button>

              <button
                type="button"
                onClick={onSave}
                disabled={saving || deleting}
                className="sm:w-auto h-8 sm:h-10 px-3 sm:px-4 rounded-lg bg-[#FF5800]
                           text-white text-sm inline-flex items-center justify-center gap-2 font-bold hover:bg-orange-600 disabled:opacity-60"
              >
                <MdSave />
                {saving ? "Saving..." : "Save"}
              </button>
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
      <div className="text-xs font-semibold text-gray-600 mb-1">{label}</div>
      {children}
    </div>
  );
}