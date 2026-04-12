import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { MdAccountBalance, MdClose } from "react-icons/md";

import { fetchBankDetailById } from "../../redux/actions/bankActions";
import { bankReset } from "../../redux/reducer/bankSlice";

export default function BankDetailsModal({ open, onClose, employeeCode }) {
  const dispatch = useDispatch();
  const { detail, loading, error } = useSelector((s) => s.bank || {});

  useEffect(() => {
    if (!open) return;
    if (!employeeCode) {
      toast.error("Employee code missing.");
      return;
    }
    dispatch(bankReset());
    dispatch(fetchBankDetailById({ employeeId: employeeCode }));
  }, [open, employeeCode, dispatch]);

  useEffect(() => {
    if (error) toast.error(String(error));
  }, [error]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center px-2 py-2 sm:px-4 sm:py-4">
      <div className="w-full max-w-3xl h-[92vh] sm:h-auto sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b bg-gradient-to-r from-[#0e1b34] to-[#1d3b8b] text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <MdAccountBalance className="text-xl" />
            </div>

            <div className="min-w-0">
              <div className="text-sm sm:text-base font-semibold">
                Bank Details
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-white/10 transition shrink-0"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="rounded-xl border border-[#dbe7ff] bg-[#f5f9ff] px-3 py-2 text-sm font-medium text-[#285ea8]">
              Fetching bank details...
            </div>
          ) : detail ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Field label="Bank Name" value={detail.bank_name} />
              <Field label="IFSC Code" value={detail.ifsc_code} />
              <Field label="Branch Name" value={detail.branch_name} />
              <Field label="Account Number" value={detail.account_number} />
              <Field label="PF Number" value={detail.pf_number} />
              <Field label="UAN Number" value={detail.uan_number} />
            </div>
          ) : (
            <div className="text-sm text-gray-500">No bank details found.</div>
          )}
        </div>

        {/* Footer */}
        
      </div>
    </div>,
    document.body
  );
}

function Field({ label, value }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-[#0e1b34] mt-1 break-words">
        {value || "—"}
      </div>
    </div>
  );
}