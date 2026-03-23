import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { MdAccountBalance, MdClose } from "react-icons/md";

import { fetchBankDetailById } from "../../redux/actions/bankActions";
import { bankReset } from "../../redux/reducer/bankSlice";

export default function BankDetailsModal({
  open,
  onClose,
  employeeCode,
}) {
  const dispatch = useDispatch();
  const { detail, loading, error } = useSelector((s) => s.bank || {});

  // GET API runs when modal opens
  useEffect(() => {
    if (!open) return;
    if (!employeeCode) {
      toast.error("Employee code missing.");
      return;
    }
    dispatch(bankReset());
    dispatch(fetchBankDetailById({ employeeId: employeeCode })); // ← YTPL520IT direct
  }, [open, employeeCode, dispatch]);

  useEffect(() => {
    if (error) toast.error(String(error));
  }, [error]);

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
                <div className="text-[11px] sm:text-[13px] text-[#74819a] mt-1">
                  Employee:{" "}
                  <span className="font-semibold text-[#1f2b46]">
                    {employeeCode ?? "—"}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-[#667085] hover:bg-[#f4f7fb] transition shrink-0"
            >
              <MdClose className="text-[20px] sm:text-[24px]" />
            </button>
          </div>

          {/* Body — Read Only */}
          <div className="px-3 py-3 sm:px-6 sm:py-5">
            {loading ? (
              <div className="rounded-xl border border-[#dbe7ff] bg-[#f5f9ff] px-3 py-2 text-[13px] font-medium text-[#285ea8]">
                Fetching bank details...
              </div>
            ) : detail ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <Field label="Bank Name" value={detail.bank_name} />
                <Field label="Account Number" value={detail.account_number} />
                <Field label="IFSC Code" value={detail.ifsc_code} />
                <Field label="Branch Name" value={detail.branch_name} />
              </div>
            ) : (
              <div className="text-[13px] text-[#8a96ab]">
                No bank details found.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-3 sm:px-6 sm:py-4 border-t border-[#edf1f6] bg-[#fffefe] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 sm:h-11 min-w-[100px] rounded-[12px] sm:rounded-[16px] px-4 text-[13px] font-semibold text-white bg-[#ff5a00] hover:bg-[#e85000] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Field({ label, value }) {
  return (
    <div>
      <label className="block mb-1.5 text-[12px] sm:text-[14px] font-semibold text-[#49566f]">
        {label}
      </label>
      <div className="w-full h-[42px] sm:h-[50px] rounded-[12px] sm:rounded-[16px] border border-[#dbe2eb] bg-[#f7f9fc] px-3 sm:px-4 flex items-center text-[13px] sm:text-[14px] text-[#172647] font-medium">
        {value || <span className="text-[#9aa6b8]">—</span>}
      </div>
    </div>
  );
}
